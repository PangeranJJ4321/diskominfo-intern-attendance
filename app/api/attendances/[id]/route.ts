import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { updateAttendanceSchema } from "@/lib/schemas/attendance";

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
 * GET /api/attendances/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        internId: true,
        agencyScheduleId: true,
        date: true,
        attendanceTime: true,
        attendanceLatitude: true,
        attendanceLongitude: true,
        attendanceFaceDescriptor: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        intern: {
          select: {
            id: true,
            userId: true,
            agencyId: true,
            institutionId: true,
            startedAt: true,
            finishedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        agencySchedule: {
          select: {
            id: true,
            agencyId: true,
            name: true,
            dayOfWeek: true,
            agencyScheduleStart: true,
            agencyScheduleEnd: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Data absensi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "SUPERADMIN") {
      return NextResponse.json(attendance);
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(attendance.intern.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }

      return NextResponse.json(attendance);
    }

    if (session.user.role === "INTERN") {
      if (attendance.intern.userId === session.user.id) {
        return NextResponse.json(attendance);
      }

      const scope = await getViewerScope(session.user.id);
      const hasSharedAgency = scope.agencyIds.includes(
        attendance.intern.agencyId,
      );
      const hasSharedInstitution =
        attendance.intern.institutionId !== null &&
        scope.institutionIds.includes(attendance.intern.institutionId);

      if (!hasSharedAgency && !hasSharedInstitution) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }

      return NextResponse.json(attendance);
    }

    return NextResponse.json(
      { error: "Forbidden - insufficient permissions" },
      { status: 403 },
    );
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/attendances/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data absensi" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/attendances/[id]
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    const body = await _req.json();
    const parsed = updateAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        internId: true,
        agencyScheduleId: true,
        date: true,
        intern: {
          select: {
            userId: true,
            agencyId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data absensi tidak ditemukan" },
        { status: 404 },
      );
    }

    const resolvedInternId = parsed.data.internId ?? existing.internId;
    const resolvedAgencyScheduleId =
      parsed.data.agencyScheduleId ?? existing.agencyScheduleId;
    const resolvedDate = parsed.data.date ?? existing.date;

    const [intern, agencySchedule, duplicate] = await Promise.all([
      prisma.intern.findUnique({
        where: { id: resolvedInternId },
        select: { id: true, agencyId: true },
      }),
      prisma.agencySchedule.findUnique({
        where: { id: resolvedAgencyScheduleId },
        select: { id: true, agencyId: true },
      }),
      prisma.attendance.findFirst({
        where: {
          id: { not: id },
          internId: resolvedInternId,
          agencyScheduleId: resolvedAgencyScheduleId,
          date: resolvedDate,
        },
        select: { id: true },
      }),
    ]);

    if (!intern) {
      return NextResponse.json(
        { error: "Peserta magang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!agencySchedule) {
      return NextResponse.json(
        { error: "Jadwal dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    if (intern.agencyId !== agencySchedule.agencyId) {
      return NextResponse.json(
        { error: "Jadwal tidak sesuai dengan dinas peserta magang" },
        { status: 409 },
      );
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(intern.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    } else if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    if (duplicate) {
      return NextResponse.json(
        { error: "Catatan absensi dengan kombinasi tersebut sudah ada" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...parsed.data,
        attendanceLatitude: parsed.data.attendanceLatitude ?? undefined,
        attendanceLongitude: parsed.data.attendanceLongitude ?? undefined,
        attendanceFaceDescriptor:
          parsed.data.attendanceFaceDescriptor !== undefined
            ? (parsed.data.attendanceFaceDescriptor as Prisma.InputJsonValue)
            : undefined,
        notes: parsed.data.notes ?? undefined,
      },
      select: {
        id: true,
        internId: true,
        agencyScheduleId: true,
        date: true,
        attendanceTime: true,
        attendanceLatitude: true,
        attendanceLongitude: true,
        attendanceFaceDescriptor: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        intern: {
          select: {
            id: true,
            userId: true,
            agencyId: true,
            startedAt: true,
            finishedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        agencySchedule: {
          select: {
            id: true,
            agencyId: true,
            name: true,
            dayOfWeek: true,
            agencyScheduleStart: true,
            agencyScheduleEnd: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/attendances/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data absensi" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/attendances/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        intern: {
          select: {
            agencyId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data absensi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(existing.intern.agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    } else if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/attendances/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus data absensi" },
      { status: 500 },
    );
  }
}
