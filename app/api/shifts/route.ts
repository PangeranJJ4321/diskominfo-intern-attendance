// app/api/shifts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createShiftSchema } from "@/lib/schemas/shift-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createTableQuerySchema(["id", "name"], "name");

/**
 * GET: List all shifts with pagination, sorting, and search
 */
export const GET = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsedParams = querySchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedParams.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, search } = parsedParams.data;
    const skip = (page - 1) * limit;

    const whereCondition = {
      deletedAt: null,
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [shifts, totalCount] = await Promise.all([
      prisma.shift.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.shift.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: shifts,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "Shift"
);

/**
 * POST: Create a new shift
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {

    const body = await request.json();
    const parsedBody = createShiftSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // Resolve agencyId from user's access
    const agencyId = dbUser.agencyAccesses[0]?.agencyId;

    if (!agencyId) {
      return NextResponse.json(
        { error: "No agency associated." },
        { status: 400 },
      );
    }

    const newShift = await prisma.shift.create({
      data: {
        agencyId,
        name: parsedBody.data.name,
        workOnHolidays: parsedBody.data.workOnHolidays,
      },
    });

    return NextResponse.json(newShift, { status: 201 });
  },
  "create",
  "Shift"
);
