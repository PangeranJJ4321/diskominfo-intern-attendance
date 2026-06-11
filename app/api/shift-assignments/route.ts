// app/api/shift-assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createShiftAssignmentSchema } from "@/lib/schemas/shift-assignment-schema";

const querySchema = createTableQuerySchema(
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
    select: { id: true, name: true },
  },
} as const;

/**
 * GET: List all shift assignments with pagination, sorting, and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agencyAccesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "ShiftAssignment")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error fetching shift assignments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new shift assignment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agencyAccesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("create", "ShiftAssignment")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

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
  } catch (error) {
    console.error("Error creating shift assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
