// lib/api-middlewares.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { defineAbilityFor, AppAbility } from "@/lib/casl";
import { User, AgencyAccess } from "@/app/generated/prisma/client";

export type AuthenticatedContext = {
  dbUser: User & { agencyAccesses: AgencyAccess[] };
  ability: AppAbility;
};

// Next.js route handlers can accept a context param, commonly { params: { id: string } }
export type ApiHandler<TContext = any> = (
  request: NextRequest,
  context: TContext,
  authCtx: AuthenticatedContext
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware to protect API routes with authentication and CASL authorization.
 * 
 * @param handler - The actual route handler to execute if checks pass.
 * @param action - The CASL action to verify (e.g., "read", "create", "update", "delete"). 
 *                 If null/undefined, CASL check is skipped (only auth is checked).
 * @param subject - The CASL subject to verify (e.g., "Agency", "Attendance").
 */
export function withAuth<TContext = any>(
  handler: ApiHandler<TContext>,
  action?: Parameters<AppAbility["can"]>[0] | null,
  subject?: Parameters<AppAbility["can"]>[1] | null
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      // 1. Session check
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }

      // 2. Database user & roles check
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { agencyAccesses: true },
      });

      if (!dbUser) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }

      // 3. CASL Authorization check
      const ability = defineAbilityFor(dbUser);
      if (action && subject) {
        if (!ability.can(action, subject)) {
          return NextResponse.json(
            { error: "Forbidden: Missing access credentials." },
            { status: 403 }
          );
        }
      }

      // 4. Execute the actual handler
      return await handler(request, context, { dbUser, ability });
    } catch (error) {
      console.error(`Error in withAuth wrapper:`, error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
