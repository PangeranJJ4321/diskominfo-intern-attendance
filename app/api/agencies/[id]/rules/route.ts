// app/api/agencies/[id]/rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
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
  },
  "read",
  "AgencyRule"
);

/**
 * POST: Create a new AgencyRule for a specific Agency (1:1 relationship).
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
  },
  "create",
  "AgencyRule"
);

/**
 * PATCH: Update the AgencyRule for a specific Agency (1:1 relationship).
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "update",
  "AgencyRule"
);

/**
 * DELETE: Remove the AgencyRule for a specific Agency.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { ability }: AuthenticatedContext) => {

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
  },
  "delete",
  "AgencyRule"
);
