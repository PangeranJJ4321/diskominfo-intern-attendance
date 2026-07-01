// app/api/shift-assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDatedQuerySchema } from "@/lib/schemas/query-schema";
import { createShiftAssignmentSchema } from "@/lib/schemas/shift-assignment-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";

const querySchema = createDatedQuerySchema(
  ["id", "internId", "shiftId", "startDate"],
  "startDate",
);

/** Shape used consistently for reading/returning shift assignment objects. */
const assignmentSelect = {
  id: true,
  internId: true,
  shiftId: true,
  startDate: true,
  endDate: true,
  intern: {
    select: {
      id: true,
      user: { select: { id: true, name: true } },
    },
  },
  shift: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

/**
 * GET: List all shift assignments with pagination, sorting, search, and optional date range filtering.
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

    // Admins see all assignments; ordinary users only see their own (via intern)
    const isAdmin = dbUser.agencyAccesses.length > 0;

    const whereCondition = {
      shift: {
        deletedAt: null,
      },
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
            AND: [
              // Assignment starts on or before the end of the query range
              {
                startDate: {
                  ...(endDate ? { lte: endDate } : {}),
                },
              },
              // Assignment has no end date OR ends on or after the start of the query range
              {
                OR: [
                  { endDate: null },
                  ...(startDate ? [{ endDate: { gte: startDate } }] : []),
                ],
              },
            ],
          }
        : {}),
    };

    const [assignments, totalCount] = await Promise.all([
      prisma.shiftAssignment.findMany({
        where: whereCondition,
        select: assignmentSelect,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.shiftAssignment.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: assignments,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },
  "read",
  "ShiftAssignment"
);

/**
 * POST: Create a new shift assignment
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

    const body = await request.json();
    const parsedBody = createShiftAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { internId, shiftId } = parsedBody.data;

    // Validate that the referenced intern exists
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
    });

    if (!intern) {
      return NextResponse.json(
        { error: "Data magang tidak ditemukan." },
        { status: 404 },
      );
    }

    // Validate that the referenced shift exists and is active
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, deletedAt: null },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    }

    const newAssignment = await prisma.shiftAssignment.create({
      data: parsedBody.data,
      select: assignmentSelect,
    });

    return NextResponse.json(newAssignment, { status: 201 });
  },
  "create",
  "ShiftAssignment"
);
