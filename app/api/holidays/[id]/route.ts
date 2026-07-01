// app/api/holidays/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateHolidaySchema } from "@/lib/schemas/holiday-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Holiday by ID
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const holiday = await prisma.agencyHoliday.findUnique({
      where: { id },
    });

    if (!holiday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(holiday);
  },
  "read",
  "Holiday"
);

/**
 * PATCH: Update a specific Holiday by ID
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingHoliday = await prisma.agencyHoliday.findUnique({
      where: { id },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateHolidaySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedHoliday = await prisma.agencyHoliday.update({
      where: { id },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedHoliday);
  },
  "update",
  "Holiday"
);

/**
 * DELETE: Remove a Holiday by ID
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingHoliday = await prisma.agencyHoliday.findUnique({
      where: { id },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    await prisma.agencyHoliday.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Holiday deleted successfully" });
  },
  "delete",
  "Holiday"
);
