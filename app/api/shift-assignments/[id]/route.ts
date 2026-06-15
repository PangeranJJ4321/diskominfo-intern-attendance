// app/api/shift-assignments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateShiftAssignmentSchema } from "@/lib/schemas/shift-assignment-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Shape used consistently for reading/returning shift assignment objects. */
const assignmentSelect = {
  id: true,
  internId: true,
  shiftId: true,
  startDate: true,
  endDate: true,
  intern: {
    select: {
      id: true,
      user: { select: { id: true, name: true } },
    },
  },
  shift: {
    select: { id: true, name: true },
  },
} as const;

/**
 * GET: Retrieve a specific ShiftAssignment by ID
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
    if (!ability.can("read", "ShiftAssignment")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id },
      select: assignmentSelect,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Shift assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching shift assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific ShiftAssignment by ID
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
    if (!ability.can("update", "ShiftAssignment")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingAssignment = await prisma.shiftAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Shift assignment not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateShiftAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // If internId is being changed, validate it exists
    if (parsedBody.data.internId) {
      const intern = await prisma.intern.findUnique({
        where: { id: parsedBody.data.internId },
      });

      if (!intern) {
        return NextResponse.json(
          { error: "Data magang tidak ditemukan." },
          { status: 404 },
        );
      }
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

    const updatedAssignment = await prisma.shiftAssignment.update({
      where: { id },
      data: parsedBody.data,
      select: assignmentSelect,
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating shift assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a ShiftAssignment by ID
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
    if (!ability.can("delete", "ShiftAssignment")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingAssignment = await prisma.shiftAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Shift assignment not found" },
        { status: 404 },
      );
    }

    await prisma.shiftAssignment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Shift assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shift assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
