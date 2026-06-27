// app/api/agencies/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAgencyAreaSchema } from "@/lib/schemas/agency-area-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH: Update an AgencyArea by its ID (legacy support).
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the area ID.
 * @returns A promise resolving to the NextResponse.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingArea = await prisma.agencyArea.findUnique({
      where: { id },
    });

    if (!existingArea) {
      return NextResponse.json(
        { error: "Agency area not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateAgencyAreaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedArea = await prisma.agencyArea.update({
      where: { id },
      data: parsedBody.data,
      include: { agency: true },
    });

    return NextResponse.json(updatedArea);
  },
  "update",
  "AgencyArea"
);
