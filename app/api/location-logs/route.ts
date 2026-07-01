// app/api/location-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDatedQuerySchema } from "@/lib/schemas/query-schema";
import { createLocationLogSchema } from "@/lib/schemas/location-log-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createDatedQuerySchema(
  ["id", "internId", "createdAt"],
  "createdAt",
);

/** Shape used consistently for reading/returning location log objects. */
const locationLogSelect = {
  id: true,
  internId: true,
  latitude: true,
  longitude: true,
  ipAddress: true,
  createdAt: true,
  intern: {
    select: {
      id: true,
      user: { select: { id: true, name: true } },
    },
  },
} as const;

/**
 * GET: List location logs with pagination, sorting, search, and optional date range filtering.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const GET = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {
    const session = { user: { id: dbUser.id } };

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

    const { page, limit, sortBy, sortOrder, search, startDate, endDate } =
      parsedParams.data;
    const skip = (page - 1) * limit;

    // Admins see all logs; ordinary users only see their own (via intern)
    const isAdmin = dbUser.agencyAccesses.length > 0;

    const whereCondition = {
      ...(!isAdmin ? { intern: { userId: session.user.id } } : {}),
      ...(search
        ? {
            intern: {
              user: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate
                ? { gte: new Date(`${startDate}T00:00:00.000Z`) }
                : {}),
              ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [logs, totalCount] = await Promise.all([
      prisma.locationLog.findMany({
        where: whereCondition,
        select: locationLogSelect,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.locationLog.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: logs,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "LocationLog"
);

/**
 * POST: Create a new location log entry.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { dbUser, ability }: AuthenticatedContext) => {
    const session = { user: { id: dbUser.id } };

    const body = await request.json();
    const parsedBody = createLocationLogSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { userId, latitude, longitude } = parsedBody.data;

    // Determine if user is admin
    const isAdmin = dbUser.agencyAccesses.length > 0;

    // Resolve internId from userId by finding the user's active intern record
    const intern = await prisma.intern.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!intern) {
      return NextResponse.json(
        { error: "Data magang tidak ditemukan." },
        { status: 404 },
      );
    }

    // Non-admin users can only create logs for their own intern record
    if (!isAdmin && intern.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only submit your own location logs." },
        { status: 403 },
      );
    }

    const ipAddress =
      (request as NextRequest & { ip?: string }).ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const newLog = await prisma.locationLog.create({
      data: {
        internId: intern.id,
        latitude,
        longitude,
        ipAddress: parsedBody.data.ipAddress || ipAddress,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  },
  "create",
  "LocationLog"
);
