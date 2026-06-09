// app/api/accesses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Access by ID
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

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("read", "Access")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const access = await prisma.access.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Access record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(access);
  } catch (error) {
    console.error("Error fetching access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove an Access record by ID
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

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("delete", "Access")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingAccess = await prisma.access.findUnique({
      where: { id },
    });

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Access record not found" },
        { status: 404 },
      );
    }

    await prisma.access.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Access record deleted successfully" });
  } catch (error) {
    console.error("Error deleting access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
