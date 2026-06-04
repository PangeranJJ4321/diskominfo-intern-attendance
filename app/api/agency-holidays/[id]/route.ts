import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateAgencyHolidaySchema } from "@/lib/schemas/agency-holiday";

async function requireAgencyAccess(
  agencyId: string,
  session?: Session | null,
): Promise<Session> {
  const currentSession = session ?? (await requireAuth());

  if (currentSession.user.role === "SUPERADMIN") {
    return currentSession;
  }

  if (currentSession.user.role !== "ADMIN") {
    throw NextResponse.json(
      { error: "Forbidden - insufficient permissions" },
      { status: 403 },
    );
  }

  const access = await prisma.agencyAccess.findFirst({
    where: { agencyId, userId: currentSession.user.id },
    select: { id: true },
  });

  if (!access) {
    throw NextResponse.json(
      { error: "Forbidden - you do not have access to this agency" },
      { status: 403 },
    );
  }

  return currentSession;
}

/**
 * PATCH /api/agency-holidays/[id]
 * Body: { date?, description? }
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = updateAgencyHolidaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existing = await prisma.agencyHoliday.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hari libur dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await requireAgencyAccess(existing.agencyId, session);

    const holiday = await prisma.agencyHoliday.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        agencyId: true,
        date: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(holiday, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/agency-holidays/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui hari libur dinas" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agency-holidays/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const existing = await prisma.agencyHoliday.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hari libur dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await requireAgencyAccess(existing.agencyId, session);

    await prisma.agencyHoliday.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/agency-holidays/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus hari libur dinas" },
      { status: 500 },
    );
  }
}
