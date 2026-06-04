// app/api/interns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { type Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  allowedInternSortColumns,
  createInternSchema,
} from "@/lib/schemas/intern";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

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
 * GET /api/interns
 * Retrieves a paginated list of interns.
 * Requires ADMIN or SUPERADMIN role.
 * Query params: page, limit, q, sortBy, sortOrder
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(
      allowedInternSortColumns,
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

    const queryFilter: Prisma.InternWhereInput = q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};

    let where: Prisma.InternWhereInput = queryFilter;

    if (session.user.role === "SUPERADMIN") {
      where = queryFilter;
    } else if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (agencyIds.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { totalRowCount: 0, totalPages: 0 },
        });
      }

      where = {
        AND: [queryFilter, { agencyId: { in: agencyIds } }],
      };
    } else if (session.user.role === "INTERN") {
      const scope = await getViewerScope(session.user.id);

      if (scope.agencyIds.length === 0 && scope.institutionIds.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { totalRowCount: 0, totalPages: 0 },
        });
      }

      where = {
        AND: [
          queryFilter,
          {
            OR: [
              { agencyId: { in: scope.agencyIds } },
              { institutionId: { in: scope.institutionIds } },
              { userId: session.user.id },
            ],
          },
        ],
      };
    } else {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const orderBy = { [sortBy]: sortOrder };

    const [interns, total] = await Promise.all([
      prisma.intern.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          agencyId: true,
          institutionId: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.intern.count({ where }),
    ]);

    return NextResponse.json({
      data: interns,
      meta: { totalRowCount: total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[GET /api/interns]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data peserta magang" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/interns
 * Creates a new intern record.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!["SUPERADMIN", "ADMIN", "INTERN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = createInternSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { userId, agencyId, institutionId, startedAt, finishedAt } =
      parsed.data;

    if (session.user.role === "INTERN" && userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    if (session.user.role === "ADMIN") {
      const agencyIds = await getAccessibleAgencyIds(session.user.id);

      if (!agencyIds.includes(agencyId)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // Guard: do not create duplicate intern record for same user and agency
    const existing = await prisma.intern.findFirst({
      where: { userId, agencyId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Peserta magang untuk user ini di dinas tersebut sudah ada" },
        { status: 409 },
      );
    }

    const intern = await prisma.intern.create({
      data: {
        userId,
        agencyId,
        institutionId: institutionId ?? undefined,
        startedAt,
        finishedAt: finishedAt ?? undefined,
      },
      select: {
        id: true,
        userId: true,
        agencyId: true,
        institutionId: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(intern, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[POST /api/interns]", error);
    return NextResponse.json(
      { error: "Gagal membuat peserta magang" },
      { status: 500 },
    );
  }
}
