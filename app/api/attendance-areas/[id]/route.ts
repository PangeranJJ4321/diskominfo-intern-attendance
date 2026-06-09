// app/api/attendance-areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor } from "@/lib/casl";
import { updateAreaSchema } from "@/lib/schemas/attendance-area-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a specific AttendanceArea by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const area = await prisma.attendanceArea.findUnique({
      where: { id },
    });

    if (!area) {
      return NextResponse.json(
        { error: "Attendance area not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(area);
  } catch (error) {
    console.error("Error fetching attendance area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: Update a specific AttendanceArea by ID (Protected by ABAC)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate Session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // 2. Fetch User with Access relations for CASL evaluation
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

    // 3. Evaluate ABAC permissions via CASL
    const ability = defineAbilityFor(dbUser);
    if (!ability.can("update", "AttendanceArea")) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have the required access permissions to update resource data.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    // 4. Check if the target record exists before running update mutations
    const existingArea = await prisma.attendanceArea.findUnique({
      where: { id },
    });

    if (!existingArea) {
      return NextResponse.json(
        { error: "Attendance area not found" },
        { status: 404 },
      );
    }

    // 5. Parse and Validate Request Payload using the centralized partial schema
    const body = await request.json();
    const parsedBody = updateAreaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedBody.error.format(),
        },
        { status: 400 },
      );
    }

    // 6. DB Update Mutation
    const updatedArea = await prisma.attendanceArea.update({
      where: { id },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedArea);
  } catch (error) {
    console.error("Error updating attendance area:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
