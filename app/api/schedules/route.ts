// app/api/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
import {
  createScheduleSchema,
  scheduleQuerySchema,
} from "@/lib/schemas/schedule-schema";

/**
 * GET: List all schedules with pagination, sorting, and search
 */
export const GET = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsedParams = scheduleQuerySchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedParams.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, search, dayOfWeek } =
      parsedParams.data;
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = {
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
      ...(dayOfWeek.length > 0 ? { dayOfWeek: { in: dayOfWeek } } : {}),
    };

    const [schedules, totalCount] = await Promise.all([
      prisma.schedule.findMany({
        where: whereCondition,
        select: {
          id: true,
          shiftId: true,
          name: true,
          dayOfWeek: true,
          windowStart: true,
          scheduleStart: true,
          lateCutoff: true,
          scheduleEnd: true,
          shift: {
            select: { id: true, name: true, workOnHolidays: true },
          },
        },
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
  },
  "read",
  "Schedule"
);

/**
 * POST: Create a new schedule
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

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
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    }

    const newSchedule = await prisma.schedule.create({
      data: parsedBody.data,
      select: {
        id: true,
        shiftId: true,
        name: true,
        dayOfWeek: true,
        windowStart: true,
        scheduleStart: true,
        lateCutoff: true,
        scheduleEnd: true,
        shift: {
          select: { id: true, name: true, workOnHolidays: true },
        },
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  },
  "create",
  "Schedule"
);
