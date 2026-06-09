// app/api/agencies/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateAgencyAreaSchema } from "@/lib/schemas/agency-area-schema";

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
    if (!ability.can("update", "AgencyArea")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error updating agency area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
