// app/api/institutions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createInstitutionSchema } from "@/lib/schemas/institution-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createTableQuerySchema(["id", "name", "createdAt"], "name");

/**
 * GET: List all institutions with pagination, sorting, and search.
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

    const [institutions, totalCount] = await Promise.all([
      prisma.institution.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.institution.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: institutions,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "Institution"
);

/**
 * POST: Create a new institution.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

    const body = await request.json();
    const parsedBody = createInstitutionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const newInstitution = await prisma.institution.create({
      data: parsedBody.data,
    });

    return NextResponse.json(newInstitution, { status: 201 });
  },
  "create",
  "Institution"
);
