// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTableQuerySchema } from "@/lib/schemas/query-schema";
import { createUserSchema } from "@/lib/schemas/user-schema";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
import { hashPassword } from "better-auth/crypto";
import { generateCuid } from "@/lib/string-utils";

const querySchema = createTableQuerySchema(
  ["id", "name", "email", "createdAt"],
  "id",
);

/**
 * GET: List all users with pagination, sorting, and search filtering.
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
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
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
  },
  "read",
  "User"
);

/**
 * POST: Create a new user.
 *
 * @param request - The incoming NextRequest.
 * @returns A promise resolving to the NextResponse.
 */
export const POST = withAuth(
  async (request: NextRequest, context: any, { ability }: AuthenticatedContext) => {

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

    const result = await prisma.$transaction(async (txClient) => {
      const tx = txClient as typeof prisma;
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
  },
  "create",
  "User"
);
