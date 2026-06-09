import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { pathname } = request.nextUrl;

  // If the user is NOT signed in and tries to access protected routes,
  // redirect them to the sign-in page.
  if (!session) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
    return NextResponse.next();
  }

  // If the user IS signed in, check their access level for role-based routing.
  // The root "/" should redirect based on access as well.
  if (pathname === "/") {
    // Fetch the user's access records to determine their role
    const hasAccess = await checkUserAccess(session.user.id);

    if (hasAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Prevent non-admin users from accessing /admin routes
  if (pathname.startsWith("/admin")) {
    const hasAccess = await checkUserAccess(session.user.id);

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If the user is signed in and visits auth pages, redirect them away
  if (pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up")) {
    const hasAccess = await checkUserAccess(session.user.id);

    if (hasAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Checks if a user has an Access record in the database,
 * which grants them admin-level privileges.
 */
async function checkUserAccess(userId: string): Promise<boolean> {
  try {
    // Use the internal API endpoint to check access
    // This avoids importing Prisma directly in proxy (which runs at the edge/proxy layer)
    const { PrismaClient } = await import("@/app/generated/prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    const prisma = new PrismaClient({ adapter });

    const access = await prisma.access.findFirst({
      where: { userId },
    });

    return !!access;
  } catch (error) {
    console.error("Failed to check user access:", error);
    return false;
  }
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
  ],
};
