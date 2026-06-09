// app/api/shifts/[id]/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createScheduleSchema } from "@/lib/schemas/schedule-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const querySchema = createTableQuerySchema(
  ["id", "name", "dayOfWeek", "scheduleStart", "createdAt"],
  "dayOfWeek",
);

/**
 * GET: List all schedules belonging to a specific shift
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Verify the shift exists and is active
    const shift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 },
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
      shiftId: id,
      deletedAt: null,
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
    console.error("Error fetching shift schedules:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new schedule under this shift
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Verify the shift exists and is active
    const shift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    // Override shiftId with the URL param to ensure consistency
    const parsedBody = createScheduleSchema.safeParse({
      ...body,
      shiftId: id,
    });

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newSchedule = await prisma.schedule.create({
      data: parsedBody.data,
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule for shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
