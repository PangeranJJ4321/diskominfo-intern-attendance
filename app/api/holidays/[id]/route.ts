// app/api/holidays/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateHolidaySchema } from "@/lib/schemas/holiday-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific Holiday by ID
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
    if (!ability.can("read", "Holiday")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error fetching holiday:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific Holiday by ID
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

    const ability = defineAbilityFor(dbUser);
    if (!ability.can("update", "Holiday")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsedBody = updateHolidaySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    const updatedHoliday = await prisma.holiday.update({
      where: { id },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedHoliday);
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a Holiday by ID
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
    if (!ability.can("delete", "Holiday")) {
      return NextResponse.json(
        { error: "Forbidden: Missing access credentials." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 },
      );
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
