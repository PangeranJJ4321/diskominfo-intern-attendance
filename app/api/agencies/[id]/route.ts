// app/api/agencies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAgencySchema } from "@/lib/schemas/agency-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Agency by ID.
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const agency = await prisma.agency.findUnique({
      where: { id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json(agency);
  },
  "read",
  "Agency"
);

/**
 * PATCH: Update a specific Agency by ID.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAgency = await prisma.agency.findUnique({
      where: { id },
    });

    if (!existingAgency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateAgencySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { defaultShiftId, ...restData } = parsedBody.data;
    // Transform flat defaultShiftId into Prisma relation connect/disconnect syntax.
    const updateData: Record<string, unknown> = { ...restData };

    if (defaultShiftId !== undefined) {
      if (defaultShiftId === null) {
        updateData.defaultShift = { disconnect: true };
      } else {
        updateData.defaultShift = { connect: { id: defaultShiftId } };
      }
    }

    const updatedAgency = await prisma.agency.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedAgency);
  },
  "update",
  "Agency"
);

/**
 * DELETE: Remove an Agency by ID.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAgency = await prisma.agency.findUnique({
      where: { id },
    });

    if (!existingAgency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    await prisma.agency.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Agency deleted successfully" });
  },
  "delete",
  "Agency"
);
