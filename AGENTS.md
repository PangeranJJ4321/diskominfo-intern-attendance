<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `https://nextjs.org/docs`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# GitHub Copilot Instructions for Prisma Workspace

## General Guidelines

1. **Language**: English only.
2. **Types**: Declare explicit types; avoid `any`.
3. **Comments**: Use JSDoc for public methods and classes.
4. **Exports**: One export per file.
5. **Naming**:

   * **Classes/interfaces** → `PascalCase`
   * **Variables/functions** → `camelCase`
   * **Files/directories** → `kebab-case`
   * **Constants** → `UPPERCASE`
   * **Boolean flags** → verb-based (e.g., `isLoading`)

---

## Prisma-Specific Guidelines

### 1. Data Modeling

* **Domain-driven model names**: keep them singular (e.g. `User`, `OrderItem`).
* **Field naming**: use `camelCase` for fields (e.g. `createdAt`, `deletedAt`).
* **IDs & keys**:

  ```prisma
  model Post {
    id    Int    @id @default(autoincrement())
    uuid  String @unique @default(uuid())
  }
  /```
* **Composite keys & uniques**:

  ```prisma
  @@id([userId, role])
  @@unique([email, tenantId])
  /```
* **Enums & constrained values**: leverage `enum` for fixed domains.
* **Soft deletes & audit**:

  ```prisma
  model Base {
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    deletedAt DateTime?
  }
  /```

### 2. Indexing & Constraints

* **Single-column indexes** for frequent lookups:

  ```prisma
  @@index([email])
  /```
* **Compound indexes** for multi-field filters/sorts:

  ```prisma
  @@index([status, createdAt])
  /```
* **Full-text search** (Postgres-only):

  ```prisma
  @@index([title, content], type: Brin)  // or Gin for JSONB
  /```

### 3. Migrations

* **Descriptive names**: `npx prisma migrate dev --name add-order-totals`
* **Idempotent steps**: avoid imperative SQL in migrations.
* **Shadow database**: enable in CI to catch drift.
* **Never edit** migration SQL after it’s applied to any environment.

### 4. Client Instantiation & Connection Management

* **Singleton pattern**

  ```ts
  // prisma.ts
  import { PrismaClient } from '../prisma/generated/client';
  export const prisma = global.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
  /```

### 5. Transactions & Batch Operations

* **Multi-step atomicity**:

  ```ts
  const result = await prisma.$transaction([
    prisma.user.create({ data: { /*…*/ } }),
    prisma.order.create({ data: { /*…*/ } }),
  ]);
  /```
* **Interactive transactions** for long-running flows.
* **Bulk writes**: chunk large inserts/updates to avoid timeouts.

### 6. Precise Queries & Performance

* **Select only needed fields**:

  ```ts
  await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  /```
* **Avoid N+1**: use `include` or batch `findMany` with `where: { id: { in: [...] } }` or use database joins in prisma.
* Use **Cursor-based pagination**

### 7. Raw Queries & Client Extensions

* **Raw SQL** when necessary, safely:

  ```ts
  const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
  /```
* **Sanitize inputs** with `Prisma.sql` for complex interpolations.
* **Client extensions**: use preview feature `clientExtensions` to add common helper methods.

### 8. Error Handling

* **Catch specific errors**:

  ```ts
  try {
    // …
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint
    }
  }
  /```
* **Wrap in service-level errors** to add context before bubbling up.

### 9. Testing

* **In-memory DB** (SQLite) or **Testcontainers** for integration tests.
* **Mock Prisma Client** for pure unit tests via `jest.mock()` or similar.

### 10. Logging, Monitoring & Metrics

* **Enable query logging** in dev:

  ```ts
  new PrismaClient({ log: ['query', 'warn', 'error'] });
  /```
* **APM integration** (Datadog, Sentry) – capture latency, errors.

### 11. Security & Best Practices

* **Never expose** raw Prisma client in HTTP controllers—wrap in a service layer.
* **Validate inputs** (e.g. with Zod) before any DB operation.
* **Least privilege** DB users: use separate roles for migrations vs. runtime.
* **Rotate credentials** and load from secure vault (AWS Secrets Manager, etc.).

### 12. Environment & Configuration

* **Centralize `DATABASE_URL`** and connection settings in `.env`.
* **Pin preview features** in `schema.prisma`:

  ```prisma
  generator client {
    previewFeatures = ["clientExtensions", "interactiveTransactions"]
  }
  /```
* **Version pinning**: match CLI and client versions in `package.json`.

<!-- BEGIN:betterauth-agent-rules -->

# Better Auth : ALWAYS read docs before coding
 
Before any Better Auth work, find and read the relevant doc in `https://better-auth.com/llms.txt`. Your training data is outdated — the docs are the source of truth.

<!-- END:betterauth-agent-rules -->

<!-- BEGIN:shadcn-agent-rules -->

# Shadcn : ALWAYS read docs before coding
 
Before any UI and shadcn work, find and read the relevant doc in `https://ui.shadcn.com/llms.txt`. Your training data is outdated — the docs are the source of truth. Components are CLI-installed; do not hallucinate props that aren't in the base Radix-based components.

<!-- END:shadcn-agent-rules -->

<!-- BEGIN:zod-agent-rules -->

# Zod : ALWAYS read docs before coding
 
Before any schema, api route, or anything related to server and client communication work, find and read the relevant doc in `https://zod.dev/`. Your training data is outdated — the docs are the source of truth.

<!-- END:zod-agent-rules -->

<!-- BEGIN:internationalization-agent-rules -->

# Internationalization : ALWAYS read docs before coding
 
Before UI and validation work, find and read the relevant doc in `https://next-intl.dev/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:internationalization-agent-rules -->

# Agent Directives

## 2. Architectural Rules
- **Server Components (RSC) by Default:** All components are Server Components unless ` 'use client' ` is strictly required (interactivity, hooks, state).
- **Data Access Layer:** Use `@/lib/dal.ts` file to authenticate and authorize user when accessing api backend.
- **Data Fetching:** When using Server Components. use `await` and Prisma directly. Avoid creating unnecessary Route Handlers for internal data fetching.
- **Form Handling:** Use **zod** for all mutations and validation.
- **Type Safety:** Check `@/lib/schemas/...` folder for the single source of truth for both frontend form validation and backend request parsing. Ensure all routes and input components are validated using **Zod**.
- **Optimistic:** When patching, creating, or deleting data, follow this flow:
***Snapshot:*** Create `previousData` from the current state.
***Optimistic Apply:*** Immediately update the UI state with projected data using schemas from `@/lib/schemas/...`.
***Execution:*** Perform the API call to the Route.
***Reconciliation:*** (On Success) Update temporary data with the final server response. (On Error) Roll back to `previousData`.
- **Internationalization:** Use Internationalization by https://next-intl.dev/docs/usage/translations.

## 4. Coding Style
- **Clean Code:** Use functional components, arrow functions, and descriptive variable names.
- **Clean Types:** Never use any, unknown, and undefine type, always use type that created from **Zod**.
- **Structured Responses:** Use NextResponse for all api responses with appropriate status codes.
- **UI/UX:** prioritize accessibility (aria-labels) and responsive design using shadcn and tailwindcss.
