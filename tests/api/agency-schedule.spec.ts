import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Agency Schedule API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let ownerAdminId = "";
  let ownerAdminCookie = "";
  let agencyId = "";
  let scheduleId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Agency Schedule ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const ownerAdmin = await apiTestUtils.createCredentialUser({
      name: `schedule-admin-${runId}`,
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

  test("creates schedule", async () => {
    const created = await apiTestUtils.apiRequest<Response>(
      "/api/agency-schedules",
      {
        method: "POST",
        cookie: ownerAdminCookie,
        body: {
          agencyId,
          name: `Morning ${runId}`,
          dayOfWeek: 1,
          agencyScheduleStart: "08:00:00",
          agencyScheduleEnd: "16:00:00",
        },
      },
    );
    expect(created.status).toBe(201);
    scheduleId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists schedule", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-schedules?agencyId=${agencyId}`,
      {
        cookie: ownerAdminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(listedBody.data.some((item) => item.id === scheduleId)).toBeTruthy();
  });

  test("updates schedule", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/agency-schedules/${scheduleId}`,
      {
        method: "PATCH",
        cookie: ownerAdminCookie,
        body: {
          name: `Morning Updated ${runId}`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes schedule", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/agency-schedules/${scheduleId}`,
      {
        method: "DELETE",
        cookie: ownerAdminCookie,
      },
    );
    expect(removed.status).toBe(200);
  });
});
