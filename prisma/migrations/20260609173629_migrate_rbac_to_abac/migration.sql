-- Give SUPERADMIN users access to all agencies (RBAC to ABAC data migration)
INSERT INTO "agency_access" ("id", "agencyId", "userId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  a.id,
  u.id,
  NOW(),
  NOW()
FROM "user" u
CROSS JOIN "agency" a
WHERE u.role = 'SUPERADMIN'
AND NOT EXISTS (
  SELECT 1 FROM "agency_access" aa 
  WHERE aa."userId" = u.id AND aa."agencyId" = a.id
);

-- Drop the role column from the user table
ALTER TABLE "user" DROP COLUMN "role";

-- Drop the Role enum type
DROP TYPE "Role";