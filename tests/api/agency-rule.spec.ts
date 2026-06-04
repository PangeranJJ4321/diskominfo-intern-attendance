import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

test.describe.serial("Agency Rule API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let ownerAdminId = "";
  let ownerAdminCookie = "";
  let agencyId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Agency Rule ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const ownerAdmin = await apiTestUtils.createCredentialUser({
      name: `rule-admin-${runId}`,
      role: "ADMIN",
      runId,
      superadminCookie,
    });
    ownerAdminId = ownerAdmin.id;
    ownerAdminCookie = ownerAdmin.cookie;

    const ownerAccess = await apiTestUtils.apiRequest<Response>(
      "/api/agency-accesses",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          agencyId,
          userId: ownerAdminId,
        },
      },
    );
    expect(ownerAccess.status).toBe(201);
  });

  test.afterAll(async () => {
    if (agencyId) {
      await apiTestUtils.deleteIfExists(
        `/api/agencies/${agencyId}`,
        superadminCookie,
      );
    }
    if (ownerAdminId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${ownerAdminId}`,
        superadminCookie,
      );
    }
  });

  test("reads agency rule", async () => {
    // 1. GET the default auto-created rule
    const fetched = await apiTestUtils.apiRequest<Response>(
      `/api/agency-rules/${agencyId}`,
      {
        cookie: ownerAdminCookie,
      },
    );
    expect(fetched.status).toBe(200);
  });

  test("updates agency rule", async () => {
    // 2. PATCH the existing rule
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/agency-rules/${agencyId}`,
      {
        method: "PATCH",
        cookie: ownerAdminCookie,
        body: {
          requireFaceVerification: false,
          lateToleranceMinutes: 20,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes agency rule", async () => {
    // 3. DELETE the rule
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-rules/${agencyId}`,
      {
        method: "DELETE",
        cookie: ownerAdminCookie,
      },
    );
    expect(removed.status).toBe(200);
  });

  test("creates agency rule", async () => {
    // 4. POST (create) a new rule now that the existing one is deleted
    const created = await apiTestUtils.apiRequest<Response>(
      `/api/agency-rules/${agencyId}`,
      {
        method: "POST",
        cookie: ownerAdminCookie,
        body: {
          lateToleranceMinutes: 25,
        },
      },
    );
    expect(created.status).toBe(201);
  });
});
