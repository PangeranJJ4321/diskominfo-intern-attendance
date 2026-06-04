import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateAgencyScheduleSchema } from "@/lib/schemas/agency-schedule";

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
 * PATCH /api/agency-schedules/[id]
 * Updates a specific agency schedule.
 * Requires ADMIN or SUPERADMIN role.
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
    const parsed = updateAgencyScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existing = await prisma.agencySchedule.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Jadwal dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await requireAgencyAccess(existing.agencyId, session);

    const schedule = await prisma.agencySchedule.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        agencyId: true,
        name: true,
        dayOfWeek: true,
        agencyScheduleStart: true,
        agencyScheduleEnd: true,
        createdAt: true,
        updatedAt: true,
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/agency-schedules/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui jadwal dinas" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agency-schedules/[id]
 * Deletes a specific agency schedule.
 * Requires ADMIN or SUPERADMIN role.
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

    const existing = await prisma.agencySchedule.findUnique({
      where: { id },
      select: { id: true, agencyId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Jadwal dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await requireAgencyAccess(existing.agencyId, session);

    await prisma.agencySchedule.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/agency-schedules/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus jadwal dinas" },
      { status: 500 },
    );
  }
}
