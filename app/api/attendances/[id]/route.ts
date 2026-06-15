// app/api/attendances/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { defineAbilityFor } from "@/lib/casl";
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
      include: { agencyAccesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "Attendance")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific Attendance by ID
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      include: { agencyAccesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("update", "Attendance")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove an Attendance record by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      include: { agencyAccesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("delete", "Attendance")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
