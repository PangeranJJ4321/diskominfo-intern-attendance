import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Intern API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let agencyId = "";
  let institutionId = "";
  let internUserId = "";
  let internCookie = "";
  let internId = "";

  test.beforeAll(async () => {
    superadminCookie = (await apiTestUtils.loadAuthState()).superadminCookie;

    const agency = await apiTestUtils.apiRequest<Response>("/api/agencies", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `Intern Agency ${runId}`,
      },
    });
    expect(agency.status).toBe(201);
    agencyId = (await apiTestUtils.readJson<{ id: string }>(agency)).id;

    const institution = await apiTestUtils.apiRequest<Response>(
      "/api/institutes",
      {
        method: "POST",
        cookie: superadminCookie,
        body: {
          name: `Intern Institution ${runId}`,
        },
      },
    );
    expect(institution.status).toBe(201);
    institutionId = (await apiTestUtils.readJson<{ id: string }>(institution))
      .id;

    const internUser = await apiTestUtils.createCredentialUser({
      name: `intern-user-${runId}`,
      role: "INTERN",
      runId,
      superadminCookie,
    });
    internUserId = internUser.id;
    internCookie = internUser.cookie;
  });

  test.afterAll(async () => {
    if (agencyId) {
      await apiTestUtils.deleteIfExists(
        `/api/agencies/${agencyId}`,
        superadminCookie,
      );
    }
    if (institutionId) {
      await apiTestUtils.deleteIfExists(
        `/api/institutes/${institutionId}`,
        superadminCookie,
      );
    }
    if (internUserId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${internUserId}`,
        superadminCookie,
      );
    }
  });

  test("creates intern", async () => {
    const created = await apiTestUtils.apiRequest<Response>("/api/interns", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        userId: internUserId,
        agencyId,
        institutionId,
        startedAt: "2026-01-10T00:00:00.000Z",
      },
    });
    expect(created.status).toBe(201);
    internId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists intern", async () => {
    const listed = await apiTestUtils.apiRequest<Response>("/api/interns", {
      cookie: superadminCookie,
    });
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(listedBody.data.some((item) => item.id === internId)).toBeTruthy();
  });

  test("reads intern", async () => {
    const readByIntern = await apiTestUtils.apiRequest<Response>(
      `/api/interns/${internId}`,
      {
        cookie: internCookie,
      },
    );
    expect(readByIntern.status).toBe(200);
  });

  test("updates intern", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/interns/${internId}`,
      {
        method: "PATCH",
        cookie: superadminCookie,
        body: {
          finishedAt: "2026-02-10T00:00:00.000Z",
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes intern", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/interns/${internId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
    internId = "";
  });
});
