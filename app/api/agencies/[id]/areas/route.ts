// app/api/agencies/[id]/areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
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
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "read",
  "AgencyArea"
);

/**
 * POST: Create a new AgencyArea for a specific Agency (1:1 relationship).
 */
export const POST = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "create",
  "AgencyArea"
);

/**
 * PATCH: Update the AgencyArea for a specific Agency (1:1 relationship).
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "update",
  "AgencyArea"
);

/**
 * DELETE: Remove the AgencyArea for a specific Agency.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "delete",
  "AgencyArea"
);
