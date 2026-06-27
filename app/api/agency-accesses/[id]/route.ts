// app/api/agency-accesses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAgencyAccessSchema } from "@/lib/schemas/agency-access-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific AgencyAccess by ID.
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const access = await prisma.agencyAccess.findUnique({
      where: { id },
      include: {
        user: true,
        agency: true,
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Agency access not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(access);
  },
  "read",
  "AgencyAccess"
);

/**
 * PATCH: Update a specific AgencyAccess by ID.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAccess = await prisma.agencyAccess.findUnique({
      where: { id },
    });

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Agency access not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateAgencyAccessSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { agencyId } = body;

    // Validate referenced entities if being updated
    if (parsedBody.data.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parsedBody.data.userId },
      });
      if (!targetUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
    }

    if (agencyId) {
      const targetAgency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });
      if (!targetAgency) {
        return NextResponse.json(
          { error: "Agency not found." },
          { status: 404 },
        );
      }
    }

    const updateData: Record<string, string> = {};
    if (parsedBody.data.userId) updateData.userId = parsedBody.data.userId;
    if (agencyId) updateData.agencyId = agencyId;

    const updatedAccess = await prisma.agencyAccess.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        agency: true,
      },
    });

    return NextResponse.json(updatedAccess);
  },
  "update",
  "AgencyAccess"
);

/**
 * DELETE: Remove an AgencyAccess by ID.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingAccess = await prisma.agencyAccess.findUnique({
      where: { id },
    });

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Agency access not found" },
        { status: 404 },
      );
    }

    await prisma.agencyAccess.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Agency access deleted successfully" });
  },
  "delete",
  "AgencyAccess"
);
