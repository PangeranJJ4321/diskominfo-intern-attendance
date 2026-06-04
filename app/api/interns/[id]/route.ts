import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateInternSchema } from "@/lib/schemas/intern";

async function getAccessibleAgencyIds(userId: string): Promise<string[]> {
  const accesses = await prisma.agencyAccess.findMany({
    where: { userId },
    select: { agencyId: true },
  });

  return accesses.map((access) => access.agencyId);
}

async function getViewerScope(userId: string): Promise<{
  agencyIds: string[];
  institutionIds: string[];
}> {
  const interns = await prisma.intern.findMany({
    where: { userId },
    select: { agencyId: true, institutionId: true },
  });

  return {
    agencyIds: interns.map((intern) => intern.agencyId),
    institutionIds: interns
      .map((intern) => intern.institutionId)
      .filter((value): value is string => Boolean(value)),
  };
}

/**
 * GET /api/interns/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const intern = await prisma.intern.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        agencyId: true,
        institutionId: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        agency: { select: { id: true, name: true } },
        institution: { select: { id: true, name: true } },
      },
    });

    if (!intern) {
      return NextResponse.json(
        { error: "Peserta magang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "SUPERADMIN") {
      return NextResponse.json(intern);
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(intern.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }

      return NextResponse.json(intern);
    }

    if (session.user.role === "INTERN") {
      if (intern.userId === session.user.id) {
        return NextResponse.json(intern);
      }

      const scope = await getViewerScope(session.user.id);
      const hasSharedAgency = scope.agencyIds.includes(intern.agencyId);
      const hasSharedInstitution =
        intern.institutionId !== null &&
        scope.institutionIds.includes(intern.institutionId);

      if (!hasSharedAgency && !hasSharedInstitution) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }

      return NextResponse.json(intern);
    }

    return NextResponse.json(
      { error: "Forbidden - insufficient permissions" },
      { status: 403 },
    );
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/interns/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data peserta magang" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/interns/[id]
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    const body = await _req.json();
    const parsed = updateInternSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existing = await prisma.intern.findUnique({
      where: { id },
      select: { id: true, userId: true, agencyId: true },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Peserta magang tidak ditemukan" },
        { status: 404 },
      );

    if (
      session.user.role !== "SUPERADMIN" &&
      ((parsed.data.userId && parsed.data.userId !== existing.userId) ||
        (parsed.data.agencyId && parsed.data.agencyId !== existing.agencyId))
    ) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    if (session.user.role === "INTERN" && existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(existing.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    }

    if (!["SUPERADMIN", "ADMIN", "INTERN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const intern = await prisma.intern.update({
      where: { id },
      data: parsed.data,
      select: { id: true, startedAt: true, finishedAt: true, updatedAt: true },
    });

    return NextResponse.json(intern, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/interns/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui peserta magang" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/interns/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    const existing = await prisma.intern.findUnique({
      where: { id },
      select: { id: true, userId: true, agencyId: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Peserta magang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "SUPERADMIN") {
      // allowed
    } else if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(existing.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    } else if (session.user.role === "INTERN") {
      if (existing.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const attendanceCount = await prisma.attendance.count({
      where: { internId: id },
    });
    if (attendanceCount > 0) {
      return NextResponse.json(
        {
          error: `Peserta magang tidak dapat dihapus karena memiliki ${attendanceCount} catatan kehadiran`,
        },
        { status: 409 },
      );
    }

    await prisma.intern.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/interns/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus peserta magang" },
      { status: 500 },
    );
  }
}
