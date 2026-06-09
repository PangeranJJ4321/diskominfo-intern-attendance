// app/api/users/[id]/face-descriptors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { subject } from "@casl/ability";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: List face descriptors for a specific user
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

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Users can read their own face descriptors; admins can read anyone's
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", subject("FaceDescriptor", { userId: targetUser.id }) as unknown as Parameters<typeof ability.can>[1])) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const faceDescriptors = await prisma.faceDescriptor.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: faceDescriptors });
  } catch (error) {
    console.error("Error fetching face descriptors:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new face descriptor for a specific user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Users can register their own face descriptors; admins can register anyone's
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("create", subject("FaceDescriptor", { userId: targetUser.id }) as unknown as Parameters<typeof ability.can>[1])) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const body = await request.json();

    if (!body.descriptor || !Array.isArray(body.descriptor)) {
      return NextResponse.json(
        { error: "Invalid request payload: 'descriptor' must be an array." },
        { status: 400 },
      );
    }

    const newDescriptor = await prisma.faceDescriptor.create({
      data: {
        userId: id,
        descriptor: body.descriptor,
      },
    });

    return NextResponse.json(newDescriptor, { status: 201 });
  } catch (error) {
    console.error("Error creating face descriptor:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove all face descriptors for a specific user
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
      include: { agencyAccesses: true },
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Admins can delete face descriptors; ordinary users cannot
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("delete", subject("FaceDescriptor", { userId: targetUser.id }) as unknown as Parameters<typeof ability.can>[1])) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    await prisma.faceDescriptor.deleteMany({
      where: { userId: id },
    });

    return NextResponse.json({
      message: "Face descriptors deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting face descriptors:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
