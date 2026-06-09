// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { defineAbilityFor } from "@/lib/casl";
import { createUserSchema } from "@/lib/schemas/user-schema";
import { hashPassword } from "better-auth/crypto";
import { generateCuid } from "@/lib/string-utils";

const querySchema = createTableQuerySchema(["id", "name", "email", "createdAt"], "id");

/**
 * GET: List all users with pagination, sorting, and search filtering.
 * 
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
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

    // Fetch user context for CASL evaluation
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    // Evaluate ABAC permissions via CASL
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "User")) {
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
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.user.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new user.
 * 
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
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
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("create", "User")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsedBody = createUserSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const { name, email, image, emailVerified, password } = parsedBody.data;
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email address is already in use." },
        { status: 400 },
      );
    }

    const userId = generateCuid();

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: userId,
          name,
          email: normalizedEmail,
          image,
          emailVerified,
        },
      });

      if (password) {
        const hashedPassword = await hashPassword(password);
        await tx.account.create({
          data: {
            id: generateCuid(),
            userId,
            providerId: "credential",
            accountId: userId,
            password: hashedPassword,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
