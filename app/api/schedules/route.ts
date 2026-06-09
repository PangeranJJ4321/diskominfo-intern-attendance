// app/api/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createScheduleSchema } from "@/lib/schemas/schedule-schema";

const querySchema = createTableQuerySchema(
  ["id", "name", "dayOfWeek", "scheduleStart", "createdAt"],
  "dayOfWeek",
);

/**
 * GET: List all schedules with pagination, sorting, and search
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
    if (!ability.can("read", "Schedule")) {
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

    const whereCondition = {
      deletedAt: null,
      shift: {
        deletedAt: null,
      },
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [schedules, totalCount] = await Promise.all([
      prisma.schedule.findMany({
        where: whereCondition,
        include: { shift: true },
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.schedule.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: schedules,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new schedule
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
    if (!ability.can("create", "Schedule")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createScheduleSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // Validate that the referenced shift exists and is active
    const shift = await prisma.shift.findFirst({
      where: { id: parsedBody.data.shiftId, deletedAt: null },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found." },
        { status: 404 },
      );
    }

    const newSchedule = await prisma.schedule.create({
      data: parsedBody.data,
      include: { shift: true },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
