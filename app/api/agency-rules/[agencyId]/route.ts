import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  agencyRuleSchema,
  createAgencyRuleSchema,
  updateAgencyRuleSchema,
} from "@/lib/schemas/agency-rule";

const createAgencyRuleBodySchema = createAgencyRuleSchema.omit({
  agencyId: true,
});

async function requireAgencyReadAccess(
  agencyId: string,
  session: Session,
): Promise<void> {
  if (session.user.role === "SUPERADMIN") {
    return;
  }

  if (session.user.role === "ADMIN") {
    const access = await prisma.agencyAccess.findFirst({
      where: { agencyId, userId: session.user.id },
      select: { id: true },
    });

    if (!access) {
      throw NextResponse.json(
        { error: "Forbidden - you do not have access to this agency" },
        { status: 403 },
      );
    }

    return;
  }

  if (session.user.role === "INTERN") {
    const intern = await prisma.intern.findFirst({
      where: { agencyId, userId: session.user.id },
      select: { id: true },
    });

    if (!intern) {
      throw NextResponse.json(
        { error: "Forbidden - you do not have access to this agency" },
        { status: 403 },
      );
    }

    return;
  }

  throw NextResponse.json(
    { error: "Forbidden - insufficient permissions" },
    { status: 403 },
  );
}

async function requireAgencyWriteAccess(
  agencyId: string,
  session: Session,
): Promise<void> {
  if (session.user.role === "SUPERADMIN") {
    return;
  }

  if (session.user.role !== "ADMIN") {
    throw NextResponse.json(
      { error: "Forbidden - insufficient permissions" },
      { status: 403 },
    );
  }

  const access = await prisma.agencyAccess.findFirst({
    where: { agencyId, userId: session.user.id },
    select: { id: true },
  });

  if (!access) {
    throw NextResponse.json(
      { error: "Forbidden - you do not have access to this agency" },
      { status: 403 },
    );
  }
}

/**
 * GET /api/agency-rules/[agencyId]
 * Retrieves the single agency rule for the given agency.
 * Requires INTERN, ADMIN, or SUPERADMIN role.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> },
) {
  try {
    const { agencyId } = await params;
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN", "INTERN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }
    await requireAgencyReadAccess(agencyId, session);

    const rule = await prisma.agencyRule.findUnique({
      where: { agencyId },
      select: {
        id: true,
        agencyId: true,
        requireFaceVerification: true,
        requireWithinArea: true,
        lateToleranceMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(rule ? agencyRuleSchema.parse(rule) : null);
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agency-rules/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data aturan dinas" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agency-rules/[agencyId]
 * Creates the agency rule for the given agency.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> },
) {
  try {
    const { agencyId } = await params;
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }
    await requireAgencyWriteAccess(agencyId, session);

    const body = await req.json();
    const parsed = createAgencyRuleBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
      select: { id: true },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: "Aturan untuk dinas ini sudah ada" },
        { status: 409 },
      );
    }

    const rule = await prisma.agencyRule.create({
      data: {
        agencyId,
        requireFaceVerification: parsed.data.requireFaceVerification,
        requireWithinArea: parsed.data.requireWithinArea,
        lateToleranceMinutes: parsed.data.lateToleranceMinutes,
      },
      select: {
        id: true,
        agencyId: true,
        requireFaceVerification: true,
        requireWithinArea: true,
        lateToleranceMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/agency-rules/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal membuat aturan dinas" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agency-rules/[agencyId]
 * Updates the agency rule for the given agency.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> },
) {
  try {
    const { agencyId } = await params;
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }
    await requireAgencyWriteAccess(agencyId, session);

    const body = await req.json();
    const parsed = updateAgencyRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
      select: { id: true },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Aturan dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    const rule = await prisma.agencyRule.update({
      where: { agencyId },
      data: parsed.data,
      select: {
        id: true,
        agencyId: true,
        requireFaceVerification: true,
        requireWithinArea: true,
        lateToleranceMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(rule, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/agency-rules/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui aturan dinas" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agency-rules/[agencyId]
 * Deletes the agency rule for the given agency.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> },
) {
  try {
    const { agencyId } = await params;
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }
    await requireAgencyWriteAccess(agencyId, session);

    const existingRule = await prisma.agencyRule.findUnique({
      where: { agencyId },
      select: { id: true },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Aturan dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.agencyRule.delete({ where: { agencyId } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/agency-rules/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus aturan dinas" },
      { status: 500 },
    );
  }
}
