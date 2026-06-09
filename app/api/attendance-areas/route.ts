// app/api/attendance-areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createAreaSchema } from "@/lib/schemas/attendance-area-schema";

const querySchema = createTableQuerySchema(["id", "timezone"], "id");

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsedParams = querySchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedParams.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, search } = parsedParams.data;
    const skip = (page - 1) * limit;

    // Conditionally build the object using a ternary operator.
    // TypeScript perfectly infers this shape without needing explicit types.
    const whereCondition = search
      ? {
          timezone: {
            contains: search,
            mode: "insensitive" as const, // "as const" ensures it treats the string as a literal, not a generic string
          },
        }
      : {};

    const [areas, totalCount] = await Promise.all([
      prisma.attendanceArea.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.attendanceArea.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: areas,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching attendance areas:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Fetch user criteria dynamically to pass into the ABAC checker
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    // Evaluate permissions
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("create", "AttendanceArea")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createAreaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newArea = await prisma.attendanceArea.create({
      data: parsedBody.data,
    });

    return NextResponse.json(newArea, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
