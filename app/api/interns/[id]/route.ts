// app/api/interns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateInternSchema } from "@/lib/schemas/intern-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Intern by ID.
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
    if (!ability.can("read", "Intern")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error fetching intern:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific Intern by ID.
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
    if (!ability.can("update", "Intern")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error updating intern:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove an Intern by ID.
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
    if (!ability.can("delete", "Intern")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error deleting intern:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
