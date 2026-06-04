import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/schemas/user";

/**
 * GET /api/users/[id]
 * Retrieves a specific user by id.
 * Requires ADMIN or SUPERADMIN role.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        agencyAccesses: {
          select: {
            id: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        interns: {
          select: {
            agencyId: true,
          },
        },
        _count: {
          select: {
            interns: true,
            agencyAccesses: true,
            faceDescriptors: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "INTERN" && session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    if (session.user.role === "ADMIN" && session.user.id !== id) {
      const adminAgencyIds = new Set(
        (
          await prisma.agencyAccess.findMany({
            where: { userId: session.user.id },
            select: { agencyId: true },
          })
        ).map((access) => access.agencyId),
      );

      const userAgencyIds = new Set([
        ...user.agencyAccesses.map((access) => access.agency.id),
        ...user.interns.map((intern) => intern.agencyId),
      ]);

      const hasSharedAgency = [...userAgencyIds].some((agencyId) =>
        adminAgencyIds.has(agencyId),
      );

      if (!hasSharedAgency) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Updates a user.
 * Requires ADMIN or SUPERADMIN role.
 * Body: { name, email, role }
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    if (session.user.role !== "SUPERADMIN" && session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role !== "SUPERADMIN" && parsed.data.role) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    // Check email uniqueness if email is being updated
    if (parsed.data.email && parsed.data.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[PATCH /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengguna" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Deletes a user by id.
 * Requires ADMIN or SUPERADMIN role.
 * Returns 409 if the user still has intern records or agency accesses.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await requireAuth();

    if (session.user.role !== "SUPERADMIN" && session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    // Sessions, Accounts, and FaceDescriptors are typically safe to cascade delete,
    // but if not handled at the Prisma schema level via onDelete: Cascade, you may need to delete them manually here.
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[DELETE /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 },
    );
  }
}
