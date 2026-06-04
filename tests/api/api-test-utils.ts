import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

type CredentialUser = {
  id: string;
  email: string;
  password: string;
  cookie: string;
};

type AuthState = {
  superadminCookie: string;
};

const apiBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const apiOrigin = new URL(apiBaseUrl).origin;
const authStatePath = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "superadmin.json",
);

function createRunId(): string {
  return randomUUID();
}

function buildApiUrl(pathname: string): string {
  return new URL(pathname, apiBaseUrl).toString();
}

function normalizeCookieHeader(headers: Headers): string {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;

  if (typeof getSetCookie === "function") {
    const cookies = getSetCookie
      .call(headers)
      .map((cookie) => cookie.split(";")[0])
      .filter((cookie) => cookie.length > 0);

    if (cookies.length > 0) {
      return cookies.join("; ");
    }
  }

  const rawCookie = headers.get("set-cookie");

  if (!rawCookie) {
    throw new Error("Expected Better Auth to return a session cookie.");
  }

  return rawCookie
    .split(",")
    .map((cookie) => cookie.split(";")[0].trim())
    .filter((cookie) => cookie.length > 0)
    .join("; ");
}

async function signInWithEmail(
  email: string,
  password: string,
): Promise<string> {
  const endpoints = ["/api/auth/sign-in/email", "/api/auth/sign-in"];

  for (const endpoint of endpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: apiOrigin,
      },
      body: JSON.stringify({
        email,
        password,
        callbackURL: "/dashboard",
      }),
    });

    if (response.ok) {
      return normalizeCookieHeader(response.headers);
    }
  }

  throw new Error("Failed to sign in with configured auth endpoint.");
}

async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  const signupEndpoints = ["/api/auth/sign-up/email", "/api/auth/sign-up"];

  for (const endpoint of signupEndpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: apiOrigin,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      }),
    });

    if (response.ok) {
      return normalizeCookieHeader(response.headers);
    }
  }

  throw new Error("Failed to sign up with configured auth endpoint.");
}

async function createCredentialUser(options: {
  name: string;
  role: "SUPERADMIN" | "ADMIN" | "INTERN";
  runId: string;
  superadminCookie: string;
}): Promise<CredentialUser> {
  const email = `${options.name}.${options.runId}@example.com`.toLowerCase();
  const password = `${options.name}-${options.runId}-Pass123!`;
  const signupEndpoints = ["/api/auth/sign-up/email", "/api/auth/sign-up"];

  let signedUp = false;

  for (const endpoint of signupEndpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: apiOrigin,
      },
      body: JSON.stringify({
        name: options.name,
        email,
        password,
        callbackURL: "/dashboard",
      }),
    });

    if (response.ok) {
      signedUp = true;
      break;
    }
  }

  if (!signedUp) {
    throw new Error("Failed to sign up credential user.");
  }

  const userListResponse = await apiRequest<Response>(
    `/api/users?q=${encodeURIComponent(email)}`,
    {
      cookie: options.superadminCookie,
    },
  );

  if (!userListResponse.ok) {
    throw new Error("Failed to resolve created user by email.");
  }

  const userListBody = await readJson<{
    data: Array<{ id: string; email: string }>;
  }>(userListResponse);

  const createdUser = userListBody.data.find((user) => user.email === email);

  if (!createdUser) {
    throw new Error("Created user not found in /api/users query response.");
  }

  if (options.role !== "INTERN") {
    const promoteResponse = await apiRequest<Response>(
      `/api/users/${createdUser.id}`,
      {
        method: "PATCH",
        cookie: options.superadminCookie,
        body: {
          role: options.role,
        },
      },
    );

    if (!promoteResponse.ok) {
      throw new Error("Failed to promote created user role.");
    }
  }

  const cookie = await signInWithEmail(email, password);

  return {
    id: createdUser.id,
    email,
    password,
    cookie,
  };
}

async function deleteIfExists(pathname: string, cookie: string): Promise<void> {
  const response = await apiRequest<Response>(pathname, {
    method: "DELETE",
    cookie,
  });

  if (![200, 404].includes(response.status)) {
    throw new Error(
      `Failed to delete resource ${pathname} (status ${response.status}).`,
    );
  }
}

async function apiRequest<TResponse = Response>(
  pathname: string,
  options: {
    method?: string;
    cookie?: string;
    body?: object;
  } = {},
): Promise<TResponse> {
  const headers = new Headers(
    options.cookie ? { cookie: options.cookie } : undefined,
  );
  headers.set("origin", apiOrigin);

  let payload: string | undefined;

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(options.body);
  }

  return fetch(buildApiUrl(pathname), {
    method: options.method ?? "GET",
    headers,
    body: payload,
  }) as Promise<TResponse>;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.clone().json() as Promise<T>;
}

async function loadAuthState(): Promise<AuthState> {
  const fileContent = await readFile(authStatePath, "utf8");
  const parsed = JSON.parse(fileContent) as Partial<AuthState>;

  if (!parsed.superadminCookie || parsed.superadminCookie.trim().length === 0) {
    throw new Error(
      "Missing superadmin cookie in playwright/.auth/superadmin.json.",
    );
  }

  return {
    superadminCookie: parsed.superadminCookie,
  };
}

const apiTestUtils = {
  apiBaseUrl,
  authStatePath,
  buildApiUrl,
  createCredentialUser,
  createRunId,
  deleteIfExists,
  apiRequest,
  loadAuthState,
  readJson,
  signInWithEmail,
  signUpWithEmail,
};

export default apiTestUtils;
