<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Codebase Documentation & Conventions

Welcome, Antigravity AI agent. This document serves as the guide for the architecture, file structure, API endpoints, and style conventions of the `diskominfo-intern-attendance` project.

---

## 📂 Project Directory Structure

Here is the general layout of the codebase to help you navigate:

- **[`app/`](file:///d:/TEST/diskominfo-intern-attendance/app)**: Next.js App Router containing pages and endpoints.
  - `admin/`: Admin panels for managing users, areas, schedules, shifts, and holidays.
  - `auth/`: Authentication routing (Better-Auth integration).
  - `dashboard/`: User punch-in dashboard containing face attendance and location checks.
  - `profile/[userId]/`: User profile management, avatar uploads, and face descriptor registration.
  - `api/`: Backend API routes handling database logic and external service interactions.
- **[`components/`](file:///d:/TEST/diskominfo-intern-attendance/components)**: Core UI and shared components.
  - `custom/`: Domain-specific components (e.g., Navbar, LocationPermissionDialog).
  - `ui/`: Reusable primitive components (e.g., Button, Map, PlaceAutocomplete).
- **[`hooks/`](file:///d:/TEST/diskominfo-intern-attendance/hooks)**: Custom React hooks (e.g., `use-file-upload.ts`).
- **[`interfaces/`](file:///d:/TEST/diskominfo-intern-attendance/interfaces)**: Centralized TypeScript interface definitions.
- **[`lib/`](file:///d:/TEST/diskominfo-intern-attendance/lib)**: Server and client utilities.
  - `services/`: API client services wrapper around fetch requests.
  - `schemas/`: Zod validation schemas.
  - `auth.ts`, `auth-client.ts`: Better-Auth configuration.
  - `prisma.ts`: Prisma Client setup and initialization.
  - Utilities for date parsing, location checks, and face recognition.
- **[`prisma/`](file:///d:/TEST/diskominfo-intern-attendance/prisma)**: Database configuration.
  - `schema.prisma`: Database schemas and models.
  - `seed.ts`: Database seeding script.

---

## 🚦 Strict TypeScript & ESLint Rules

To maintain high code quality and type safety, the workspace enforces strict rules. Ensure your edits comply with:

1. **No Unused Variables** (`@typescript-eslint/no-unused-vars` - `error`):
   - All defined variables, imports, and parameters must be used.
2. **No `any` Type** (`@typescript-eslint/no-explicit-any` - `error`):
   - Never use `any`. Specify precise types or interfaces.
3. **No Explicit `unknown` Type** (`@typescript-eslint/no-restricted-types` - `error`):
   - Banned to encourage specific interfaces or type safety.
   - For catch clauses where types are implicitly `unknown`, avoid explicitly annotating the catch parameter (e.g., use `catch (err)` instead of `catch (err: unknown)` or `catch (err: any)`).
4. **JSDoc Documentation**:
   - Add JSDoc comments above every function to explain what they do, what parameters they accept, and what they output.

---

## 🔗 API Endpoints Reference

Please refer to [`api-endpoints.md`](file:///d:/TEST/diskominfo-intern-attendance/api-endpoints.md) for the complete list of active API routes in the application.

