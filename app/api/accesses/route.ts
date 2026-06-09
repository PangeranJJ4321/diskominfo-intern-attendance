// app/api/accesses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createAccessSchema } from "@/lib/schemas/access-schema";

const querySchema = createTableQuerySchema(
  ["id", "userId", "createdAt"],
  "createdAt",
);

/**
 * GET: List all accesses with pagination, sorting, and search
 */
export async function GET(request: NextRequest) {
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

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "Access")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
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

    const whereCondition = search
      ? {
          user: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        }
      : {};

    const [accesses, totalCount] = await Promise.all([
      prisma.access.findMany({
        where: whereCondition,
        include: { user: true },
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.access.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: accesses,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching accesses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new access record
 */
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

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("create", "Access")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createAccessSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { userId } = parsedBody.data;

    // Validate that the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    // Check for duplicate access
    const existingAccess = await prisma.access.findFirst({
      where: { userId },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: "User already has an access record." },
        { status: 400 },
      );
    }

    const newAccess = await prisma.access.create({
      data: { userId },
      include: { user: true },
    });

    return NextResponse.json(newAccess, { status: 201 });
  } catch (error) {
    console.error("Error creating access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
