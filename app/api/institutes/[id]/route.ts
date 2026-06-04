import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateInstitutionSchema } from "@/lib/schemas/institution";

/**
 * GET /api/institutes/[id]
 * Retrieves a specific institute by id.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function GET(
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

    const institute = await prisma.institution.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { interns: true },
        },
      },
    });

    if (!institute) {
      return NextResponse.json(
        { error: "Institusi tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(institute);
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/institutes/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data institusi" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/institutes/[id]
 * Updates an institute.
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

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = updateInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const existing = await prisma.institution.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Institusi tidak ditemukan" },
        { status: 404 },
      );
    }

    const institute = await prisma.institution.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(institute, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/institutes/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui institusi" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/institutes/[id]
 * Deletes an institute by id.
 * Requires ADMIN or SUPERADMIN role.
 * Returns 409 if the institute still has interns.
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

    const institute = await prisma.institution.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!institute) {
      return NextResponse.json(
        { error: "Institusi tidak ditemukan" },
        { status: 404 },
      );
    }

    const internCount = await prisma.intern.count({
      where: { institutionId: id },
    });

    if (internCount > 0) {
      return NextResponse.json(
        {
          error: `Institusi tidak dapat dihapus karena masih digunakan oleh ${internCount} peserta magang`,
        },
        { status: 409 },
      );
    }

    await prisma.institution.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/institutes/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus institusi" },
      { status: 500 },
    );
  }
}
