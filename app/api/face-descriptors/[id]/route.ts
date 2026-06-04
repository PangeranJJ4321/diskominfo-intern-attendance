import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { type Session, requireAuth } from "@/lib/dal";

async function getAdminAgencyIds(userId: string): Promise<string[]> {
  const accesses = await prisma.agencyAccess.findMany({
    where: { userId },
    select: { agencyId: true },
  });

  return [...new Set(accesses.map((access) => access.agencyId))];
}

async function canAccessDescriptor(
  descriptorId: string,
  session: Session,
): Promise<{ id: string; userId: string } | null> {
  const descriptor = await prisma.faceDescriptor.findUnique({
    where: { id: descriptorId },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          interns: {
            select: {
              agencyId: true,
            },
          },
        },
      },
    },
  });

  if (!descriptor) {
    return null;
  }

  if (session.user.role === "SUPERADMIN") {
    return { id: descriptor.id, userId: descriptor.userId };
  }

  if (session.user.role === "INTERN") {
    if (descriptor.userId !== session.user.id) {
      return null;
    }

    return { id: descriptor.id, userId: descriptor.userId };
  }

  const agencyIds = await getAdminAgencyIds(session.user.id);

  if (agencyIds.length === 0) {
    return null;
  }

  const canAccess = descriptor.user.interns.some((intern) =>
    agencyIds.includes(intern.agencyId),
  );

  if (!canAccess) {
    return null;
  }

  return { id: descriptor.id, userId: descriptor.userId };
}

/**
 * GET /api/face-descriptors/[id]
 * Retrieves a single face descriptor if the caller is allowed to see it.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const descriptor = await prisma.faceDescriptor.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        descriptor: true,
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

    if (!descriptor) {
      return NextResponse.json(
        { error: "Face descriptor tidak ditemukan" },
        { status: 404 },
      );
    }

    const access = await canAccessDescriptor(id, session);

    if (!access) {
      return NextResponse.json(
        {
          error: "Forbidden - Anda tidak memiliki akses ke face descriptor ini",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(descriptor);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/face-descriptors/[id]]", error);
    return NextResponse.json(
      { error: "Gagal mengambil face descriptor" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/face-descriptors/[id]
 * Removes a single face descriptor if the caller is allowed to manage it.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const access = await canAccessDescriptor(id, session);

    if (!access) {
      const descriptor = await prisma.faceDescriptor.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!descriptor) {
        return NextResponse.json(
          { error: "Face descriptor tidak ditemukan" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: "Forbidden - Anda tidak memiliki akses ke face descriptor ini",
        },
        { status: 403 },
      );
    }

    await prisma.faceDescriptor.delete({ where: { id } });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[DELETE /api/face-descriptors/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus face descriptor" },
      { status: 500 },
    );
  }
}
