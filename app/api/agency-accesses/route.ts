import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  agencyAccessSchema,
  createAgencyAccessSchema,
} from "@/lib/schemas/agency-access";

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
 * GET /api/agency-accesses
 * Retrieves all access rows for a single agency.
 * Requires ADMIN or SUPERADMIN role.
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
        agencyId: z.string().min(1),
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

    const { agencyId } = parsedQuery.data;

    await requireAgencyAccess(agencyId, session);

    const accesses = await prisma.agencyAccess.findMany({
      where: { agencyId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        agencyId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: accesses,
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agency-accesses]", error);
    return NextResponse.json(
      { error: "Gagal memuat akses dinas" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agency-accesses
 * Grants an admin access to an agency.
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
    const parsed = createAgencyAccessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { agencyId, userId } = parsed.data;

    await requireAgencyAccess(agencyId, session);

    const [agency, user] = await Promise.all([
      prisma.agency.findUnique({
        where: { id: agencyId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

    if (!agency) {
      return NextResponse.json(
        { error: "Dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Pengguna yang diberi akses harus berrole ADMIN" },
        { status: 403 },
      );
    }

    const existingAccess = await prisma.agencyAccess.findFirst({
      where: { agencyId, userId },
      select: {
        id: true,
        agencyId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(agencyAccessSchema.parse(existingAccess));
    }

    const createdAccess = await prisma.agencyAccess.create({
      data: { agencyId, userId },
      select: {
        id: true,
        agencyId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(agencyAccessSchema.parse(createdAccess), {
      status: 201,
    });
  } catch (error) {
    console.error("[POST /api/agency-accesses]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan akses dinas" },
      { status: 500 },
    );
  }
}
