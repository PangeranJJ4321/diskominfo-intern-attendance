//api/agencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fetchAgencyHolidaySeeds } from "@/lib/agency-holidays";
import {
  allowedAgencySortColumns,
  createAgencySchema,
} from "@/lib/schemas/agency";
import { createAgencyRuleSchema } from "@/lib/schemas/agency-rule";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

/**
 * GET /api/agencies
 * Retrieves a paginated list of agencies.
 * Requires authentication. ADMIN and SUPERADMIN receive table data,
 * while INTERN receives a minimal id/name lookup list.
 * Query params: page, limit, q, sortBy, sortOrder
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(
      allowedAgencySortColumns,
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

    // Build the dynamic sorting clause
    const orderBy = { [sortBy]: sortOrder };

    if (session.user.role === "INTERN") {
      const [agencies, total] = await Promise.all([
        prisma.agency.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
          },
        }),
        prisma.agency.count({ where }),
      ]);

      return NextResponse.json({
        data: agencies,
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

    if (session.user.role === "SUPERADMIN") {
      const [agencies, total] = await Promise.all([
        prisma.agency.findMany({
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
        prisma.agency.count({ where }),
      ]);

      return NextResponse.json({
        data: agencies,
        meta: {
          totalRowCount: total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const ownerWhere = {
      ...where,
      agencyAccesses: {
        some: {
          userId: session.user.id,
        },
      },
    };

    const [agencies, total] = await Promise.all([
      prisma.agency.findMany({
        where: ownerWhere,
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
      prisma.agency.count({ where: ownerWhere }),
    ]);

    return NextResponse.json({
      data: agencies,
      meta: {
        totalRowCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[GET /api/agencies]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dinas" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agencies
 * Creates a new agency.
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
    const parsed = createAgencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { name } = parsed.data;

    const defaultRule = createAgencyRuleSchema
      .omit({ agencyId: true })
      .parse({});
    try {
      const holidaySeeds = await fetchAgencyHolidaySeeds();

      const agency = await prisma.$transaction(async (transaction) => {
        const createdAgency = await transaction.agency.create({
          data: {
            name,
            rule: {
              create: defaultRule,
            },
            agencyAccesses: {
              create: {
                userId: session.user.id,
              },
            },
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (holidaySeeds.length > 0) {
          await transaction.agencyHoliday.createMany({
            data: holidaySeeds.map((holiday) => ({
              agencyId: createdAgency.id,
              date: holiday.date,
              description: holiday.description,
            })),
          });
        }

        return createdAgency;
      });

      return NextResponse.json(agency, { status: 201 });
    } catch (error) {
      console.error("[POST /api/agencies] holiday seed fetch failed", error);
      return NextResponse.json(
        { error: "Gagal mengambil data libur nasional dari Nager.Date" },
        { status: 502 },
      );
    }
  } catch (error) {
    if (error instanceof NextResponse) throw error;
    console.error("[POST /api/agencies]", error);
    return NextResponse.json({ error: "Gagal membuat dinas" }, { status: 500 });
  }
}
