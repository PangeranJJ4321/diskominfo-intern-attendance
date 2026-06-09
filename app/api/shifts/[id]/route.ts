// app/api/shifts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateShiftSchema } from "@/lib/schemas/shift-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Shift by ID
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
    if (!ability.can("read", "Shift")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const shift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
      include: {
        schedules: {
          where: { deletedAt: null },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific Shift by ID
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
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("update", "Shift")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingShift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingShift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateShiftSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a Shift by ID
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
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("delete", "Shift")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingShift = await prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingShift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 },
      );
    }

    // Soft delete the shift and all its schedules in a transaction
    await prisma.$transaction([
      prisma.shift.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.schedule.updateMany({
        where: { shiftId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
