import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Named export required by Next.js 16 Proxy convention
export const proxy = createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - /api/* (better-auth + API routes)
  // - /_next/* (Next.js internals)
  // - /favicon.ico, /sitemap.xml, etc. (static files)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
