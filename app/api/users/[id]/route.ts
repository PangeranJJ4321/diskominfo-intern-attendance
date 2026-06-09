// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { subject } from "@casl/ability";
import { updateUserSchema } from "@/lib/schemas/user-schema";
import { hashPassword } from "better-auth/crypto";
import { generateCuid } from "@/lib/string-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific User by ID.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the user ID.
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
      include: { accesses: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 },
      );
    }

    const { id } = await params;

    // Parse optional include query parameter
    const { searchParams } = new URL(request.url);
    const includeParam = searchParams.get("include") ?? "";
    const includeSet = new Set(
      includeParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );

    const includeClause: Record<string, boolean> = {};
    if (includeSet.has("accounts")) includeClause.accounts = true;
    if (includeSet.has("faceDescriptors")) includeClause.faceDescriptors = true;
    if (includeSet.has("accesses")) includeClause.accesses = true;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      ...(Object.keys(includeClause).length > 0
        ? { include: includeClause }
        : {}),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
    const ability = defineAbilityFor(dbUser);
    if (
      !ability.can(
        "read",
        subject("User", targetUser) as unknown as Parameters<
          typeof ability.can
        >[1],
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific User by ID.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the user ID.
 * @returns A promise resolving to the NextResponse.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
    const ability = defineAbilityFor(dbUser);
    if (
      !ability.can(
        "update",
        subject("User", targetUser) as unknown as Parameters<
          typeof ability.can
        >[1],
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { name, image, emailVerified, password } = validation.data;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(image !== undefined ? { image } : {}),
          ...(emailVerified !== undefined ? { emailVerified } : {}),
        },
      });

      if (password) {
        const hashedPassword = await hashPassword(password);
        const existingAccount = await tx.account.findFirst({
          where: {
            userId: id,
            providerId: "credential",
          },
        });

        if (existingAccount) {
          await tx.account.update({
            where: { id: existingAccount.id },
            data: { password: hashedPassword },
          });
        } else {
          await tx.account.create({
            data: {
              id: generateCuid(),
              userId: id,
              providerId: "credential",
              accountId: id,
              password: hashedPassword,
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a specific User by ID.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the user ID.
 * @returns A promise resolving to the NextResponse.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
    const ability = defineAbilityFor(dbUser);
    if (
      !ability.can(
        "delete",
        subject("User", targetUser) as unknown as Parameters<
          typeof ability.can
        >[1],
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
