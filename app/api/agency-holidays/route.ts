import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  agencyHolidaySchema,
  createAgencyHolidaySchema,
} from "@/lib/schemas/agency-holiday";

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
 * GET /api/agency-holidays
 * Retrieves a paginated list of agency holidays.
 * Requires an authenticated session.
 * Requires ADMIN or SUPERADMIN role.
 * Query params: page, limit, q, sortBy, sortOrder
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
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

    const holidays = await prisma.agencyHoliday.findMany({
      where: { agencyId },
      orderBy: { date: "asc" },
      select: {
        id: true,
        agencyId: true,
        date: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      data: holidays.map((holiday) => agencyHolidaySchema.parse(holiday)),
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agency-holidays]", error);
    return NextResponse.json(
      { error: "Gagal memuat hari libur dinas" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agency-holidays
 * Creates a new holiday.
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
    const parsed = createAgencyHolidaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { agencyId, date, description } = parsed.data;

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

    const holidayDate = new Date(date);

    const created = await prisma.agencyHoliday.create({
      data: {
        agencyId,
        date: holidayDate,
        description,
      },
      select: {
        id: true,
        agencyId: true,
        date: true,
        description: true,
        createdAt: true,
        updatedAt: true, // <-- Added updatedAt here to satisfy Zod schema
      },
    });

    return NextResponse.json(agencyHolidaySchema.parse(created), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/agency-holidays]", error);
    return NextResponse.json(
      { error: "Gagal membuat hari libur dinas" },
      { status: 500 },
    );
  }
}
