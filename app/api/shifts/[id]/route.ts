// app/api/shifts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateShiftSchema } from "@/lib/schemas/shift-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Shift by ID
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "read",
  "Shift"
);

/**
 * PATCH: Update a specific Shift by ID
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "update",
  "Shift"
);

/**
 * DELETE: Remove a Shift by ID
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "delete",
  "Shift"
);
