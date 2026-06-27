// app/api/agencies/areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createAgencyAreaSchema } from "@/lib/schemas/agency-area-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createTableQuerySchema(
  ["id", "createdAt", "timezone"],
  "createdAt",
);

/**
 * GET: List all agency areas with pagination, sorting, and search.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
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
          agency: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        }
      : {};

    const [areas, totalCount] = await Promise.all([
      prisma.agencyArea.findMany({
        where: whereCondition,
        include: { agency: true },
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.agencyArea.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: areas,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "AgencyArea"
);

/**
 * POST: Create a new agency area without agency context (legacy support).
 * Accepts an optional agencyId in the body; associates the area with that agency.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {

    const body = await request.json();
    const parsedBody = createAgencyAreaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { geoData, timezone } = parsedBody.data;
    // Use the first agency the user has access to, or allow explicit agencyId in body
    const agencyId = body.agencyId || dbUser.agencyAccesses[0]?.agencyId;

    if (!agencyId) {
      return NextResponse.json(
        { error: "No agency associated with this user. Provide an agencyId." },
        { status: 400 },
      );
    }

    // Check for existing area (1:1 relationship)
    const existingArea = await prisma.agencyArea.findUnique({
      where: { agencyId },
    });

    if (existingArea) {
      return NextResponse.json(
        { error: "Area untuk instansi ini sudah ada." },
        { status: 409 },
      );
    }

    const newArea = await prisma.agencyArea.create({
      data: {
        agencyId,
        geoData,
        timezone,
      },
      include: { agency: true },
    });

    return NextResponse.json(newArea, { status: 201 });
  },
  "create",
  "AgencyArea"
);
