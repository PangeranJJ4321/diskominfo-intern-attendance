import { expect, test } from "@playwright/test";
import apiTestUtils from "./api-test-utils";

type ListResponse = {
  data: Array<{ id: string }>;
};

test.describe.serial("User API", () => {
  const runId = apiTestUtils.createRunId();

  let superadminCookie = "";
  let userId = "";
  const email = `user-${runId}@example.com`;

  test.beforeAll(async () => {
    const authState = await apiTestUtils.loadAuthState();
    superadminCookie = authState.superadminCookie;
  });

  test.afterAll(async () => {
    if (userId) {
      await apiTestUtils.deleteIfExists(
        `/api/users/${userId}`,
        superadminCookie,
      );
    }
  });

  test("requires authentication", async () => {
    const response = await apiTestUtils.apiRequest<Response>("/api/users");
    expect(response.status).toBe(401);
  });

  test("creates user", async () => {
    const created = await apiTestUtils.apiRequest<Response>("/api/users", {
      method: "POST",
      cookie: superadminCookie,
      body: {
        name: `User ${runId}`,
        email,
        role: "INTERN",
      },
    });
    expect(created.status).toBe(201);
    userId = (await apiTestUtils.readJson<{ id: string }>(created)).id;
  });

  test("lists user", async () => {
    const listed = await apiTestUtils.apiRequest<Response>(
      `/api/users?q=${encodeURIComponent(email)}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(listed.status).toBe(200);
    const listedBody = await apiTestUtils.readJson<ListResponse>(listed);
    expect(listedBody.data.some((item) => item.id === userId)).toBeTruthy();
  });

  test("reads user", async () => {
    const detailed = await apiTestUtils.apiRequest<Response>(
      `/api/users/${userId}`,
      {
        cookie: superadminCookie,
      },
    );
    expect(detailed.status).toBe(200);
  });

  test("updates user", async () => {
    const updated = await apiTestUtils.apiRequest<Response>(
      `/api/users/${userId}`,
      {
        method: "PATCH",
        cookie: superadminCookie,
        body: {
          name: `User Updated ${runId}`,
        },
      },
    );
    expect(updated.status).toBe(200);
  });

  test("deletes user", async () => {
    const removed = await apiTestUtils.apiRequest<Response>(
      `/api/users/${userId}`,
      {
        method: "DELETE",
        cookie: superadminCookie,
      },
    );
    expect(removed.status).toBe(200);
    userId = "";
  });
});
