import { NextRequest, NextResponse } from "next/server";
import { type Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { type Session, requireAuth } from "@/lib/dal";
import {
  allowedFaceDescriptorSortColumns,
  createFaceDescriptorSchema,
} from "@/lib/schemas/face-descriptor";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

async function getAdminAgencyIds(userId: string): Promise<string[]> {
  const accesses = await prisma.agencyAccess.findMany({
    where: { userId },
    select: { agencyId: true },
  });

  return [...new Set(accesses.map((access) => access.agencyId))];
}

async function getAuthorizedWhereClause(
  session: Session,
): Promise<Prisma.FaceDescriptorWhereInput | null> {
  const { role, id: userId } = session.user;

  if (role === "SUPERADMIN") {
    return {};
  }

  if (role === "INTERN") {
    return { userId };
  }

  const agencyIds = await getAdminAgencyIds(userId);

  if (agencyIds.length === 0) {
    return null;
  }

  return {
    user: {
      interns: {
        some: {
          agencyId: { in: agencyIds },
        },
      },
    },
  };
}

function buildSearchClause(q: string): Prisma.FaceDescriptorWhereInput {
  return {
    OR: [
      { user: { name: { contains: q, mode: "insensitive" as const } } },
      { user: { email: { contains: q, mode: "insensitive" as const } } },
    ],
  };
}

/**
 * GET /api/face-descriptors
 * Retrieves a paginated list of face descriptors.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(
      allowedFaceDescriptorSortColumns,
      "createdAt",
    ).safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, q } = parsedQuery.data;
    const scopeClause = await getAuthorizedWhereClause(session);

    if (scopeClause === null) {
      return NextResponse.json({
        data: [],
        meta: { totalRowCount: 0, totalPages: 0 },
      });
    }

    const whereClauses: Prisma.FaceDescriptorWhereInput[] = [];

    if (Object.keys(scopeClause).length > 0) {
      whereClauses.push(scopeClause);
    }

    if (q) {
      whereClauses.push(buildSearchClause(q));
    }

    const where =
      whereClauses.length > 1 ? { AND: whereClauses } : (whereClauses[0] ?? {});

    const orderBy = { [sortBy]: sortOrder } as const;

    const [descriptors, total] = await Promise.all([
      prisma.faceDescriptor.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          descriptor: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.faceDescriptor.count({ where }),
    ]);

    return NextResponse.json({
      data: descriptors,
      meta: {
        totalRowCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/face-descriptors]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data face descriptor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/face-descriptors
 * Registers a new face descriptor for the authenticated user or an accessible user.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await _req.json();
    const parsed = createFaceDescriptorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const targetUserId = parsed.data.userId ?? session.user.id;
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        interns: {
          select: {
            agencyId: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    if (session.user.role === "INTERN" && targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - Anda hanya dapat mendaftarkan wajah sendiri" },
        { status: 403 },
      );
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAdminAgencyIds(session.user.id);

      if (agencyIds.length === 0) {
        return NextResponse.json(
          { error: "Forbidden - Anda tidak memiliki akses ke dinas manapun" },
          { status: 403 },
        );
      }

      const isAccessible = targetUser.interns.some((intern) =>
        agencyIds.includes(intern.agencyId),
      );

      if (!isAccessible) {
        return NextResponse.json(
          { error: "Forbidden - pengguna tidak berada dalam dinas Anda" },
          { status: 403 },
        );
      }
    }

    const createdDescriptor = await prisma.faceDescriptor.create({
      data: {
        userId: targetUserId,
        descriptor: parsed.data.descriptor as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        userId: true,
        descriptor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(createdDescriptor, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/face-descriptors]", error);
    return NextResponse.json(
      { error: "Gagal mendaftarkan face descriptor" },
      { status: 500 },
    );
  }
}
