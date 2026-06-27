// app/api/interns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateInternSchema } from "@/lib/schemas/intern-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Intern by ID.
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const intern = await prisma.intern.findUnique({
      where: { id },
      include: {
        user: true,
        agency: true,
        institution: true,
      },
    });

    if (!intern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    return NextResponse.json(intern);
  },
  "read",
  "Intern"
);

/**
 * PATCH: Update a specific Intern by ID.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingIntern = await prisma.intern.findUnique({
      where: { id },
    });

    if (!existingIntern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateInternSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // Validate referenced entities if being updated
    if (parsedBody.data.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parsedBody.data.userId },
      });
      if (!targetUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
    }

    if (parsedBody.data.agencyId) {
      const targetAgency = await prisma.agency.findUnique({
        where: { id: parsedBody.data.agencyId },
      });
      if (!targetAgency) {
        return NextResponse.json(
          { error: "Agency not found." },
          { status: 404 },
        );
      }
    }

    if (parsedBody.data.institutionId) {
      const targetInstitution = await prisma.institution.findUnique({
        where: { id: parsedBody.data.institutionId },
      });
      if (!targetInstitution) {
        return NextResponse.json(
          { error: "Institution not found." },
          { status: 404 },
        );
      }
    }

    const updatedIntern = await prisma.intern.update({
      where: { id },
      data: parsedBody.data,
      include: {
        user: true,
        agency: true,
        institution: true,
      },
    });

    return NextResponse.json(updatedIntern);
  },
  "update",
  "Intern"
);

/**
 * DELETE: Remove an Intern by ID.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

    const { id } = await params;

    const existingIntern = await prisma.intern.findUnique({
      where: { id },
    });

    if (!existingIntern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    await prisma.intern.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Intern deleted successfully" });
  },
  "delete",
  "Intern"
);
