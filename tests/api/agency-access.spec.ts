import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Agency Access API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let agencyId = "";
  let ownerAdminId = "";
  let ownerAdminCookie = "";
  let targetAdminId = "";
  let targetAccessId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Agency Access ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const ownerAdmin = await apiTestUtils.createCredentialUser({
      name: `owner-admin-${runId}`,
      role: "ADMIN",
      runId,
      superadminCookie,
    });
    ownerAdminId = ownerAdmin.id;
    ownerAdminCookie = ownerAdmin.cookie;

    const targetAdmin = await apiTestUtils.createCredentialUser({
      name: `target-admin-${runId}`,
      role: "ADMIN",
      runId,
      superadminCookie,
    });
    targetAdminId = targetAdmin.id;

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
    if (targetAdminId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${targetAdminId}`,
        superadminCookie,
      );
    }
  });

  test("creates agency access", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/agency-accesses",
      {
        method: "POST",
        cookie: ownerAdminCookie,
        body: {
          agencyId,
          userId: targetAdminId,
        },
      },
    );
    expect([200, 201]).toContain(created.status);
    targetAccessId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists agency access", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-accesses?agencyId=${agencyId}`,
      {
        cookie: ownerAdminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(
      listedBody.data.some((item) => item.id === targetAccessId),
    ).toBeTruthy();
  });

  test("revokes agency access", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-accesses/${targetAccessId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
  });
});
