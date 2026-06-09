// app/api/agencies/[id]/areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import {
  createAgencyAreaSchema,
  updateAgencyAreaSchema,
} from "@/lib/schemas/agency-area-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve the AgencyArea for a specific Agency (1:1 relationship).
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
    if (!ability.can("read", "AgencyArea")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id: agencyId } = await params;

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const area = await prisma.agencyArea.findUnique({
      where: { agencyId },
    });

    if (!area) {
      return NextResponse.json(
        { error: "Agency area not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(area);
  } catch (error) {
    console.error("Error fetching agency area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new AgencyArea for a specific Agency (1:1 relationship).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    if (!ability.can("create", "AgencyArea")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id: agencyId } = await params;

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Check for existing area (1:1 relationship)
    const existingArea = await prisma.agencyArea.findUnique({
      where: { agencyId },
    });

    if (existingArea) {
      return NextResponse.json(
        { error: "Area untuk instansi ini sudah ada." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsedBody = createAgencyAreaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newArea = await prisma.agencyArea.create({
      data: {
        agencyId,
        ...parsedBody.data,
      },
    });

    return NextResponse.json(newArea, { status: 201 });
  } catch (error) {
    console.error("Error creating agency area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update the AgencyArea for a specific Agency (1:1 relationship).
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

    const { id: agencyId } = await params;

    const existingArea = await prisma.agencyArea.findUnique({
      where: { agencyId },
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
      where: { agencyId },
      data: parsedBody.data,
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

/**
 * DELETE: Remove the AgencyArea for a specific Agency.
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
    if (!ability.can("delete", "AgencyArea")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id: agencyId } = await params;

    const existingArea = await prisma.agencyArea.findUnique({
      where: { agencyId },
    });

    if (!existingArea) {
      return NextResponse.json(
        { error: "Agency area not found" },
        { status: 404 },
      );
    }

    await prisma.agencyArea.delete({
      where: { agencyId },
    });

    return NextResponse.json({ message: "Agency area deleted successfully" });
  } catch (error) {
    console.error("Error deleting agency area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
