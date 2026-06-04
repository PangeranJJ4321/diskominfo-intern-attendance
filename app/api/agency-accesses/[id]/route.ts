import { NextRequest, NextResponse } from "next/server";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

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
 * DELETE /api/agency-accesses/[id]
 * Removes a single agency access row.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    const access = await prisma.agencyAccess.findUnique({
      where: { id },
      select: {
        id: true,
        agencyId: true,
        userId: true,
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Akses dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    if (access.userId === session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akses Anda sendiri" },
        { status: 403 },
      );
    }

    await requireAgencyAccess(access.agencyId, session);

    await prisma.agencyAccess.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/agency-accesses/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus akses dinas" },
      { status: 500 },
    );
  }
}
