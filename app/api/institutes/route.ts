// app/api/institutes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  allowedInstitutionSortColumns,
  createInstitutionSchema,
} from "@/lib/schemas/institution";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

/**
 * GET /api/institutes
 * Retrieves a paginated list of institutes.
 * Requires authentication. ADMIN and SUPERADMIN receive table data,
 * while INTERN receives a minimal id/name lookup list.
 * Query params: page, limit, q, sortBy, sortOrder
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(
      allowedInstitutionSortColumns,
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

    const where = q
      ? { name: { contains: q, mode: "insensitive" as const } }
      : {};

    const orderBy = { [sortBy]: sortOrder };

    if (session.user.role === "INTERN") {
      const [institutes, total] = await Promise.all([
        prisma.institution.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
          },
        }),
        prisma.institution.count({ where }),
      ]);

      return NextResponse.json({
        data: institutes,
        meta: {
          totalRowCount: total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const [institutes, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.institution.count({ where }),
    ]);

    return NextResponse.json({
      data: institutes,
      meta: {
        totalRowCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/institutes]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data institusi" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/institutes
 * Creates a new institute.
 * Requires ADMIN or SUPERADMIN role.
 * Body: { name }
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = createInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { name } = parsed.data;

    const institute = await prisma.institution.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(institute, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/institutes]", error);
    return NextResponse.json(
      { error: "Gagal membuat institusi" },
      { status: 500 },
    );
  }
}
