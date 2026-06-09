// app/api/interns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createInternSchema } from "@/lib/schemas/intern-schema";

const querySchema = createTableQuerySchema(
  ["id", "startedAt", "finishedAt", "createdAt"],
  "createdAt",
);

/**
 * GET: List all interns with pagination, sorting, and search.
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
    if (!ability.can("read", "Intern")) {
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

    const [interns, totalCount] = await Promise.all([
      prisma.intern.findMany({
        where: whereCondition,
        include: {
          user: true,
          agency: true,
          institution: true,
        },
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.intern.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: interns,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching interns:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new intern record.
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
    if (!ability.can("create", "Intern")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createInternSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { userId, agencyId } = parsedBody.data;

    // Validate that the referenced user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
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

    // Validate institution if provided
    if (parsedBody.data.institutionId) {
      const targetInstitution = await prisma.institution.findUnique({
        where: { id: parsedBody.data.institutionId },
      });

      if (!targetInstitution) {
        return NextResponse.json(
          { error: "Institution not found." },
          { status: 404 },
        );
      }
    }

    const newIntern = await prisma.intern.create({
      data: parsedBody.data,
      include: {
        user: true,
        agency: true,
        institution: true,
      },
    });

    return NextResponse.json(newIntern, { status: 201 });
  } catch (error) {
    console.error("Error creating intern:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
