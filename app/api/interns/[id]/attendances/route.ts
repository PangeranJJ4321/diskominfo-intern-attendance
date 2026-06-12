// app/api/interns/[id]/attendances/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createDatedQuerySchema } from "@/lib/schemas/query-schema";

import { AttendanceStatus } from "@/app/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const querySchema = createDatedQuerySchema(
  ["id", "date", "status", "attendanceTime", "createdAt"],
  "date",
);

const attendanceSelect = {
  id: true,
  internId: true,
  scheduleId: true,
  date: true,
  attendanceTime: true,
  attendanceLatitude: true,
  attendanceLongitude: true,
  attendancePhotoUrl: true,
  status: true,
  notes: true,
  createdAt: true,
  schedule: true,
} as const;

/**
 * GET: List attendances for a specific intern with optional date range filtering.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the intern ID as `id`.
 * @returns A promise resolving to the NextResponse.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id: internId } = await params;

    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      select: { id: true, userId: true },
    });

    if (!intern) {
      return NextResponse.json(
        { error: "Data magang tidak ditemukan" },
        { status: 404 },
      );
    }

    // Users can read their own intern attendances; admins can read anyone's
    const isAdmin = dbUser.agencyAccesses.length > 0;
    if (!isAdmin && intern.userId !== session.user.id) {
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

    const { page, limit, sortBy, sortOrder, search, startDate, endDate } =
      parsedParams.data;
    const skip = (page - 1) * limit;

    const whereCondition = {
      internId,
      ...(search
        ? {
            OR: [
              { date: { contains: search } },
              {
                status: {
                  equals: search.toUpperCase() as AttendanceStatus,
                },
              },
            ],
          }
        : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [attendances, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where: whereCondition,
        select: attendanceSelect,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.attendance.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      data: attendances,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching intern attendances:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
