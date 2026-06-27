// app/api/attendances/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
import { updateAttendanceSchema } from "@/lib/schemas/attendance-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Shape used consistently for reading/returning attendance objects. */
const attendanceSelect = {
  id: true,
  internId: true,
  scheduleId: true,
  date: true,
  attendanceTime: true,
  attendanceLatitude: true,
  attendanceLongitude: true,
  attendancePhotoUrl: true,
  attendanceFaceDescriptor: true,
  status: true,
  notes: true,
  createdAt: true,
  intern: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  schedule: {
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
        select: { id: true, name: true },
      },
    },
  },
} as const;

/**
 * GET: Retrieve a specific Attendance by ID
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { dbUser, ability }: AuthenticatedContext) => {
    const session = { user: { id: dbUser.id } };

    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      select: attendanceSelect,
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    // Non-admin users can only read their own attendance
    const isAdmin = dbUser.agencyAccesses.length > 0;
    if (!isAdmin && attendance.intern.user.id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    return NextResponse.json(attendance);
  },
  "read",
  "Attendance"
);

/**
 * PATCH: Update a specific Attendance by ID
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateAttendanceSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // If scheduleId is being changed, validate it exists
    if (parsedBody.data.scheduleId) {
      const schedule = await prisma.schedule.findUnique({
        where: { id: parsedBody.data.scheduleId },
      });

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found." },
          { status: 404 },
        );
      }
    }

    const data = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([, v]) => v !== undefined),
    ) as Prisma.AttendanceUncheckedUpdateInput;

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data,
      select: attendanceSelect,
    });

    return NextResponse.json(updatedAttendance);
  },
  "update",
  "Attendance"
);

/**
 * DELETE: Remove an Attendance record by ID
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Attendance record deleted successfully",
    });
  },
  "delete",
  "Attendance"
);
