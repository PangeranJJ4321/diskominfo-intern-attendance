import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  agencyScheduleSchema,
  createAgencyScheduleSchema,
} from "@/lib/schemas/agency-schedule";

async function requireAgencyAccess(
  agencyId: string,
  session?: Session | null,
): Promise<Session> {
  const currentSession = session ?? (await requireAuth());

  if (currentSession.user.role === "SUPERADMIN") {
    return currentSession;
  }

  // --- NEW: Allow INTERN if they belong to this agency ---
  if (currentSession.user.role === "INTERN") {
    const internAccess = await prisma.intern.findFirst({
      where: { userId: currentSession.user.id, agencyId },
      select: { id: true },
    });

    if (!internAccess) {
      throw NextResponse.json(
        { error: "Forbidden - you do not belong to this agency" },
        { status: 403 },
      );
    }
    return currentSession;
  }

  if (currentSession.user.role === "ADMIN") {
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

  throw NextResponse.json(
    { error: "Forbidden - insufficient permissions" },
    { status: 403 },
  );
}

/**
 * GET /api/agency-schedules
 * Retrieves a list of agency schedules.
 * Requires INTERN, ADMIN or SUPERADMIN role.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    // --- NEW: Add INTERN to allowed roles ---
    if (!["SUPERADMIN", "ADMIN", "INTERN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(_req.url);
    const parsedQuery = z
      .object({
        agencyId: z.string().min(1).optional(),
        q: z.string().min(1).optional(),
      })
      .safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.format(),
        },
        { status: 400 },
      );
    }

    const agencyId = parsedQuery.data.agencyId ?? parsedQuery.data.q;

    if (!agencyId) {
      return NextResponse.json(
        { error: "agencyId is required" },
        { status: 400 },
      );
    }

    await requireAgencyAccess(agencyId, session);

    const schedules = await prisma.agencySchedule.findMany({
      where: { agencyId },
      orderBy: { dayOfWeek: "asc" },
      select: {
        id: true,
        agencyId: true,
        name: true,
        dayOfWeek: true,
        agencyScheduleStart: true,
        agencyScheduleEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: schedules.map((schedule) => agencyScheduleSchema.parse(schedule)),
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agency-schedules]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data jadwal dinas" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agency-schedules
 * Creates a new agency schedule.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = createAgencyScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { agencyId } = parsed.data;

    await requireAgencyAccess(agencyId, session);

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

    const schedule = await prisma.agencySchedule.create({
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

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/agency-schedules]", error);
    return NextResponse.json(
      { error: "Gagal membuat jadwal dinas" },
      { status: 500 },
    );
  }
}
