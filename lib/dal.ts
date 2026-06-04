/**
 * Data Access Layer
 *
 * Handles authentication, authorization, and database queries.
 * Used for secure data fetching in server components and API routes.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type Session = typeof auth.$Infer.Session;

/**
 * Get authenticated user session
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Require the user to be logged in
 * Returns the void if successful, or a NextResponse error if not.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session || !session.user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

/**
 * Get dashboard URL based on user role
 */
export async function getDashboardUrl(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return "/dashboard/intern"; // Default fallback
  }

  switch (user.role) {
    case "SUPERADMIN":
      return "/dashboard/superadmin";
    case "ADMIN":
      return "/dashboard/admin";
    case "INTERN":
    default:
      return "/dashboard/intern";
  }
}
