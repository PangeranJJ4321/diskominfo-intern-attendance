import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateAgencySchema } from "@/lib/schemas/agency";

/**
 * GET /api/agencies/[id]
 * Retrieves a specific agency by id.
 * Requires ADMIN that has access to the agency or SUPERADMIN role, INTERN only return the agency information.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const { role } = session.user;

    // 1. If user is ADMIN, verify they have specific access to this agency
    if (role === "ADMIN") {
      const access = await prisma.agencyAccess.findFirst({
        where: { agencyId: id, userId: session.user.id },
        select: { id: true },
      });

      if (!access) {
        return NextResponse.json(
          { error: "Forbidden - you do not have access to this agency" },
          { status: 403 },
        );
      }
    }

    // 2. If user is INTERN, return limited agency information
    // (Hides sensitive info like agencyAccesses and intern _count)
    if (role === "INTERN") {
      const agencyInfo = await prisma.agency.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!agencyInfo) {
        return NextResponse.json(
          { error: "Dinas tidak ditemukan" },
          { status: 404 },
        );
      }

      return NextResponse.json(agencyInfo);
    }

    // 3. For SUPERADMIN and authorized ADMIN, return the full payload
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        rule: {
          select: {
            id: true,
            requireFaceVerification: true,
            requireWithinArea: true,
            lateToleranceMinutes: true,
          },
        },
        agencyAreas: {
          select: {
            id: true,
            geoData: true,
            timezone: true,
          },
        },
        agencyAccesses: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            interns: true,
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(agency);
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agencies/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dinas" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agencies/[id]
 * Updates an agency.
 * Requires ADMIN or SUPERADMIN role.
 * Body: { name }
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

    if (session.user.role === "ADMIN") {
      const access = await prisma.agencyAccess.findFirst({
        where: { agencyId: id, userId: session.user.id },
        select: { id: true },
      });

      if (!access) {
        return NextResponse.json(
          { error: "Forbidden - you do not have access to this agency" },
          { status: 403 },
        );
      }
    }

    const body = await _req.json();
    const parsed = updateAgencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    // Check if agency exists
    const existing = await prisma.agency.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    const agency = await prisma.agency.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(agency, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/agencies/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui dinas" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agencies/[id]
 * Deletes an agency by id.
 * Requires ADMIN or SUPERADMIN role.
 * Returns 409 if the agency still has interns or access records.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    // Check if agency exists
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Dinas tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.agency.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/agencies/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus dinas" },
      { status: 500 },
    );
  }
}
