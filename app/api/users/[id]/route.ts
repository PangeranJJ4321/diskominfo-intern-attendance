// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedContext } from "@/lib/api-middlewares";
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
export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams, { dbUser, ability }: AuthenticatedContext) => {
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

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        ...(includeSet.has("accounts") ? { accounts: true } : {}),
        ...(includeSet.has("faceDescriptors") ? { faceDescriptors: true } : {}),
        ...(includeSet.has("accesses") ? { agencyAccesses: true } : {}),
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
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
  }
);

/**
 * PATCH: Update a specific User by ID.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the user ID.
 * @returns A promise resolving to the NextResponse.
 */
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams, { dbUser, ability }: AuthenticatedContext) => {
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
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

    const updatedUser = await prisma.$transaction(async (txClient) => {
      const tx = txClient as typeof prisma;
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
  }
);

/**
 * DELETE: Remove a specific User by ID.
 *
 * @param request - The incoming NextRequest.
 * @param context - Route parameters containing the user ID.
 * @returns A promise resolving to the NextResponse.
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams, { dbUser, ability }: AuthenticatedContext) => {
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Evaluate ABAC permissions via CASL
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
  }
);
