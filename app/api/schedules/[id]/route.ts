// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateScheduleSchema } from "@/lib/schemas/schedule-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Schedule by ID
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        deletedAt: null,
        shift: {
          deletedAt: null,
        },
      },
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

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(schedule);
  },
  "read",
  "Schedule"
);

/**
 * PATCH: Update a specific Schedule by ID
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingSchedule = await prisma.schedule.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateScheduleSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // If shiftId is being changed, validate it exists and is active
    if (parsedBody.data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: parsedBody.data.shiftId, deletedAt: null },
      });

      if (!shift) {
        return NextResponse.json(
          { error: "Shift not found." },
          { status: 404 },
        );
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
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

    return NextResponse.json(updatedSchedule);
  },
  "update",
  "Schedule"
);

/**
 * DELETE: Remove a Schedule by ID
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingSchedule = await prisma.schedule.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    await prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  },
  "delete",
  "Schedule"
);
