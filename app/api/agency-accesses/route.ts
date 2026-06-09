// app/api/agency-accesses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createAgencyAccessSchema } from "@/lib/schemas/agency-access-schema";

const querySchema = createTableQuerySchema(["id", "createdAt"], "createdAt");

/**
 * GET: List all agency accesses with pagination, sorting, and search.
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
    if (!ability.can("read", "AgencyAccess")) {
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

    const whereCondition = search
      ? {
          user: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        }
      : {};

    const [accesses, totalCount] = await Promise.all([
      prisma.agencyAccess.findMany({
        where: whereCondition,
        include: {
          user: true,
          agency: true,
        },
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.agencyAccess.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: accesses,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching agency accesses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new agency access.
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
    if (!ability.can("create", "AgencyAccess")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createAgencyAccessSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { agencyId } = body;

    if (!agencyId || typeof agencyId !== "string") {
      return NextResponse.json(
        { error: "Agency ID wajib diisi." },
        { status: 400 },
      );
    }

    // Validate that the referenced user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: parsedBody.data.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Validate that the referenced agency exists
    const targetAgency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!targetAgency) {
      return NextResponse.json({ error: "Agency not found." }, { status: 404 });
    }

    const newAccess = await prisma.agencyAccess.create({
      data: {
        agencyId,
        userId: parsedBody.data.userId,
      },
      include: {
        user: true,
        agency: true,
      },
    });

    return NextResponse.json(newAccess, { status: 201 });
  } catch (error) {
    console.error("Error creating agency access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
