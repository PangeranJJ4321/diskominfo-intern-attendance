import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, type Session } from "@/lib/dal";
import { type Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  agencyAreaSchema,
  createAgencyAreaSchema,
} from "@/lib/schemas/agency-area";

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
 * GET /api/agency-areas/[agencyId]
 * Retrieves an agency area by agencyId.
 * Requires ADMIN, SUPERADMIN, or INTERN role.
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

    // Use findFirst to search by agencyId instead of findUnique
    const area = await prisma.agencyArea.findFirst({
      where: { agencyId },
      select: {
        id: true,
        agencyId: true,
        timezone: true,
        geoData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!area) {
      return NextResponse.json(null);
    }

    return NextResponse.json(agencyAreaSchema.parse(area));
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agency-areas/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data area dinas" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/agency-areas/[agencyId]
 * Updates or creates an agency area by agencyId.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function PUT(
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

    if (session.user.role === "ADMIN") {
      await requireAgencyAccess(agencyId, session);
    }

    const body = await req.json();
    const parsed = createAgencyAreaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validasi gagal",
          details: z.flattenError(parsed.error).fieldErrors,
        },
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

    const area = await prisma.agencyArea.upsert({
      where: { agencyId },
      update: {
        geoData: parsed.data.geoData as Prisma.InputJsonValue,
        timezone: parsed.data.timezone,
      },
      create: {
        agencyId,
        timezone: parsed.data.timezone,
        geoData: parsed.data.geoData as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        agencyId: true,
        timezone: true,
        geoData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(agencyAreaSchema.parse(area));
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PUT /api/agency-areas/[agencyId]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui area dinas" },
      { status: 500 },
    );
  }
}
