import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { allowedUserSortColumns, createUserSchema } from "@/lib/schemas/user";
import { tableQuerySchema } from "@/lib/schemas/table-query-schema";

/**
 * GET /api/users
 * Retrieves a paginated list of users.
 * Requires ADMIN or SUPERADMIN role.
 * Query params: page, limit, q, role, sortBy, sortOrder
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    // Parse URL params through our Zod schema
    const { searchParams } = new URL(_req.url);
    const parsedQuery = tableQuerySchema(allowedUserSortColumns, "createdAt")
      .extend({
        role: z.enum([Role.SUPERADMIN, Role.ADMIN, Role.INTERN]).optional(),
      })
      .safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.format(),
        },
        { status: 400 },
      );
    }

    const { page, limit, sortBy, sortOrder, q, role } = parsedQuery.data;

    const where = {
      ...(role && { role }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Build the dynamic sorting clause
    const orderBy = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        totalRowCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users
 * Creates a new user.
 * Requires ADMIN or SUPERADMIN role.
 * Body: { name, email, role }
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await _req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 422 },
      );
    }

    const { name, email, role } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan oleh pengguna lain" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/users]", error);
    return NextResponse.json(
      { error: "Gagal membuat pengguna" },
      { status: 500 },
    );
  }
}
