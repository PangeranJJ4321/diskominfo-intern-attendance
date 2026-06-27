// app/api/agencies/[id]/rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import {
  createAgencyRuleSchema,
  updateAgencyRuleSchema,
} from "@/lib/schemas/agency-rule-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve the AgencyRule for a specific Agency (1:1 relationship).
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
    if (!ability.can("read", "AgencyRule")) {
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

    const rule = await prisma.agencyRule.findUnique({
      where: { agencyId },
      include: {
        agency: true,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Agency rule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching agency rule:", error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: "Internal Server Error", message, stack },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new AgencyRule for a specific Agency (1:1 relationship).
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
    if (!ability.can("create", "AgencyRule")) {
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

    // Check for existing rule (1:1 relationship)
    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: "Aturan untuk instansi ini sudah ada." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsedBody = createAgencyRuleSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newRule = await prisma.agencyRule.create({
      data: {
        agencyId,
        ...parsedBody.data,
      },
      include: {
        agency: true,
      },
    });

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error("Error creating agency rule:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update the AgencyRule for a specific Agency (1:1 relationship).
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
    if (!ability.can("update", "AgencyRule")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id: agencyId } = await params;

    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Agency rule not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateAgencyRuleSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedRule = await prisma.agencyRule.update({
      where: { agencyId },
      data: parsedBody.data,
      include: {
        agency: true,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Error updating agency rule:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove the AgencyRule for a specific Agency.
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
    if (!ability.can("delete", "AgencyRule")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id: agencyId } = await params;

    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Agency rule not found" },
        { status: 404 },
      );
    }

    await prisma.agencyRule.delete({
      where: { agencyId },
    });

    return NextResponse.json({ message: "Agency rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting agency rule:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
