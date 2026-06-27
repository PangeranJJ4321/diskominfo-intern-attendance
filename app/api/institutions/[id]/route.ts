// app/api/institutions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateInstitutionSchema } from "@/lib/schemas/institution-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Institution by ID.
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const institution = await prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(institution);
  },
  "read",
  "Institution"
);

/**
 * PATCH: Update a specific Institution by ID.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingInstitution = await prisma.institution.findUnique({
      where: { id },
    });

    if (!existingInstitution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateInstitutionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedInstitution = await prisma.institution.update({
      where: { id },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedInstitution);
  },
  "update",
  "Institution"
);

/**
 * DELETE: Remove an Institution by ID.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingInstitution = await prisma.institution.findUnique({
      where: { id },
    });

    if (!existingInstitution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    await prisma.institution.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Institution deleted successfully" });
  },
  "delete",
  "Institution"
);
