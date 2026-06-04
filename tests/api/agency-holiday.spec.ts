import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Agency Holiday API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let ownerAdminId = "";
  let ownerAdminCookie = "";
  let agencyId = "";
  let holidayId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Agency Holiday ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const ownerAdmin = await apiTestUtils.createCredentialUser({
      name: `holiday-admin-${runId}`,
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

  test("creates holiday", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/agency-holidays",
      {
        method: "POST",
        cookie: ownerAdminCookie,
        body: {
          agencyId,
          date: "2026-08-17",
          description: `Holiday ${runId}`,
        },
      },
    );
    expect(created.status).toBe(201);
    holidayId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists holiday", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-holidays?agencyId=${agencyId}`,
      {
        cookie: ownerAdminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(listedBody.data.some((item) => item.id === holidayId)).toBeTruthy();
  });

  test("updates holiday", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/agency-holidays/${holidayId}`,
      {
        method: "PATCH",
        cookie: ownerAdminCookie,
        body: {
          description: `Holiday Updated ${runId}`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes holiday", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-holidays/${holidayId}`,
      {
        method: "DELETE",
        cookie: ownerAdminCookie,
      },
    );
    expect(removed.status).toBe(200);
  });
});
