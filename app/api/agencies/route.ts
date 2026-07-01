// app/api/agencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createAgencySchema } from "@/lib/schemas/agency-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createTableQuerySchema(["id", "name", "createdAt"], "name");

/**
 * GET: List all agencies with pagination, sorting, and search.
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

    const whereCondition = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [agencies, totalCount] = await Promise.all([
      prisma.agency.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.agency.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: agencies,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "Agency"
);

/**
 * POST: Create a new agency.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {
    const body = await request.json();
    const parsedBody = createAgencySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newAgency = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: parsedBody.data,
      });

      // Automatically grant access to the creator
      await tx.agencyAccess.create({
        data: {
          agencyId: agency.id,
          userId: dbUser.id,
        },
      });

      // Pre-initialize default agency rules
      await tx.agencyRule.create({
        data: {
          agencyId: agency.id,
          requireFaceVerification: true,
          requireWithinArea: true,
        },
      });

      return agency;
    });

    return NextResponse.json(newAgency, { status: 201 });
  },
  "create",
  "Agency"
);
