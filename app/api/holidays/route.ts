// app/api/holidays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createDatedQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createHolidaySchema } from "@/lib/schemas/holiday-schema";
import { fetchHolidaySeeds } from "@/lib/get-holidays";

const querySchema = createDatedQuerySchema(
  ["id", "date", "description", "createdAt"],
  "date",
);

let lastSyncTime = 0;
let isSyncing = false;
const SYNC_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * GET: List all holidays with pagination, sorting, search, and optional date range filtering.
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
    if (!ability.can("read", "Holiday")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    // Auto-create/sync holidays if they haven't been synced within the cooldown period
    const now = Date.now();
    if (!isSyncing && now - lastSyncTime >= SYNC_COOLDOWN_MS) {
      isSyncing = true;
      try {
        const seeds = await fetchHolidaySeeds();
        const existingHolidays = await prisma.agencyHoliday.findMany({
          select: { date: true, description: true },
        });

        const existingKeys = new Set(
          existingHolidays.map(
            (h: { date: string; description: string }) =>
              `${h.date}:${h.description}`,
          ),
        );

        const newSeeds = seeds.filter(
          (seed) => !existingKeys.has(`${seed.date}:${seed.description}`),
        );

        // Resolve a default agency to associate holidays with
        const defaultAgency = await prisma.agency.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (defaultAgency && newSeeds.length > 0) {
          await prisma.agencyHoliday.createMany({
            data: newSeeds.map((seed) => ({
              agencyId: defaultAgency.id,
              date: seed.date,
              description: seed.description,
            })),
          });
          console.log(`Auto-created ${newSeeds.length} public holidays.`);
        }

        lastSyncTime = now;
      } catch (syncError) {
        console.warn(
          "Failed to automatically sync/create public holidays:",
          syncError,
        );
        console.warn(
          "Failed to automatically sync/create public holidays:",
          syncError,
        );
      } finally {
        isSyncing = false;
      }
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
      ...(search
        ? {
            description: {
              contains: search,
              mode: "insensitive" as const,
            },
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

    const [holidays, totalCount] = await Promise.all([
      prisma.agencyHoliday.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.agencyHoliday.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: holidays,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new holiday
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
    if (!ability.can("create", "Holiday")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createHolidaySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // Resolve agencyId: use provided value, or fall back to user's first access
    const agencyId =
      parsedBody.data.agencyId || dbUser.agencyAccesses[0]?.agencyId;

    if (!agencyId) {
      return NextResponse.json(
        { error: "No agency associated. Provide an agencyId." },
        { status: 400 },
      );
    }

    const newHoliday = await prisma.agencyHoliday.create({
      data: {
        agencyId,
        date: parsedBody.data.date,
        description: parsedBody.data.description,
      },
    });

    return NextResponse.json(newHoliday, { status: 201 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
