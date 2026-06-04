import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("Institution API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let institutionId = "";
  const institutionName = `Institution ${runId}`;

  test.beforeAll(async () => {
    const authState = await apiTestUtils.loadAuthState();
    superadminCookie = authState.superadminCookie;
  });

  test.afterAll(async () => {
    if (institutionId) {
      await apiTestUtils.deleteIfExists(
        `/api/institutes/${institutionId}`,
        superadminCookie,
      );
    }
  });

  test("creates institution", async () => {
    const created = await apiTestUtils.apiRequest<Response>("/api/institutes", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: institutionName,
      },
    });
    expect(created.status).toBe(201);
    institutionId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists institution", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/institutes?q=${encodeURIComponent(institutionName)}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(
      listedBody.data.some((item) => item.id === institutionId),
    ).toBeTruthy();
  });

  test("reads institution", async () => {
    const detailed = await apiTestUtils.apiRequest<Response>(
      `/api/institutes/${institutionId}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(detailed.status).toBe(200);
  });

  test("updates institution", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/institutes/${institutionId}`,
      {
        method: "PATCH",
        cookie: superadminCookie,
        body: {
          name: `${institutionName} Updated`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes institution", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/institutes/${institutionId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
    institutionId = "";
  });
});
