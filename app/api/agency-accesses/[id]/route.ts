// app/api/agency-accesses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateAgencyAccessSchema } from "@/lib/schemas/agency-access-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific AgencyAccess by ID.
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
    if (!ability.can("read", "AgencyAccess")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error fetching agency access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific AgencyAccess by ID.
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
    if (!ability.can("update", "AgencyAccess")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error updating agency access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove an AgencyAccess by ID.
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
    if (!ability.can("delete", "AgencyAccess")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error deleting agency access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
