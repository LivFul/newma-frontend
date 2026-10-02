import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE_HOST,
  SESSION_COOKIE_DEV,
  isSecureRequest,
  readSessionId,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/demo/session";
import { demoApi, demoFetch, DemoApiError } from "@/lib/demo/api";

describe("sessionCookieName", () => {
  it("uses the __Host- prefix on https and the plain dev name on http", () => {
    expect(sessionCookieName(true)).toBe("__Host-newma_demo_sid");
    expect(sessionCookieName(false)).toBe("newma_demo_sid");
    expect(SESSION_COOKIE_HOST).toBe("__Host-newma_demo_sid");
    expect(SESSION_COOKIE_DEV).toBe("newma_demo_sid");
  });
});

describe("sessionCookieOptions", () => {
  it("is HttpOnly, SameSite=Lax, Path=/ and Secure only on https", () => {
    expect(sessionCookieOptions(true, 3600)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    expect(sessionCookieOptions(false, 60).secure).toBe(false);
  });
});

describe("isSecureRequest", () => {
  it("reads x-forwarded-proto", () => {
    expect(isSecureRequest(new Headers({ "x-forwarded-proto": "https" }))).toBe(true);
    expect(isSecureRequest(new Headers({ "x-forwarded-proto": "http" }))).toBe(false);
    expect(isSecureRequest(new Headers())).toBe(false);
  });
});

describe("readSessionId", () => {
  const store = (entries: Record<string, string>) => ({
    get: (name: string) => (name in entries ? { name, value: entries[name] } : undefined),
  });
  it("reads the cookie that matches the request scheme", () => {
    expect(readSessionId(store({ "__Host-newma_demo_sid": "a" }), true)).toBe("a");
    expect(readSessionId(store({ newma_demo_sid: "b" }), false)).toBe("b");
  });
  it("returns undefined when the cookie is absent or empty", () => {
    expect(readSessionId(store({}), true)).toBeUndefined();
    expect(readSessionId(store({ "__Host-newma_demo_sid": "" }), true)).toBeUndefined();
  });
});

describe("demoApi", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("throws a clear error when NEWMA_API_URL or BFF_SERVICE_TOKEN is missing", () => {
    vi.stubEnv("NEWMA_API_URL", "");
    vi.stubEnv("BFF_SERVICE_TOKEN", "x");
    expect(() => demoApi()).toThrow(/NEWMA_API_URL/);
    vi.stubEnv("NEWMA_API_URL", "https://api.example");
    vi.stubEnv("BFF_SERVICE_TOKEN", "");
    expect(() => demoApi()).toThrow(/BFF_SERVICE_TOKEN/);
  });
  it("returns a client bound to the env base URL and session", async () => {
    vi.stubEnv("NEWMA_API_URL", "https://api.example");
    vi.stubEnv("BFF_SERVICE_TOKEN", "tok");
    const fetchMock = vi.fn<(input: Request) => Promise<Response>>(async () =>
      Response.json({ status: "ok", version: "0" }),
    );
    const client = demoApi("sid-1", fetchMock as unknown as typeof fetch);
    await client.GET("/healthz");
    const req = fetchMock.mock.calls[0][0];
    expect(req.url).toBe("https://api.example/healthz");
    expect(req.headers.get("authorization")).toBe("Bearer tok");
    expect(req.headers.get("x-demo-session")).toBe("sid-1");
  });
});

describe("demoFetch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const arm = (response: Response) => {
    vi.stubEnv("NEWMA_API_URL", "https://api.example/");
    vi.stubEnv("BFF_SERVICE_TOKEN", "tok");
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };
  const sentRequest = (fetchMock: ReturnType<typeof vi.fn>) => {
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    return { url, init, headers: new Headers(init.headers) };
  };

  it("posts JSON with the service token, session header and no caching", async () => {
    const fetchMock = arm(Response.json({ session_id: "s" }, { status: 201 }));
    const result = await demoFetch<{ session_id: string }>("/v1/demo/sessions", {
      method: "POST",
      body: { persona: "scientist" },
      sessionId: "sid",
    });
    expect(result).toEqual({
      status: 201,
      data: { session_id: "s" },
      headers: expect.any(Headers),
    });
    const { url, init, headers } = sentRequest(fetchMock);
    expect(url).toBe("https://api.example/v1/demo/sessions");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBe(JSON.stringify({ persona: "scientist" }));
    expect(headers.get("authorization")).toBe("Bearer tok");
    expect(headers.get("x-demo-session")).toBe("sid");
    expect(headers.get("content-type")).toBe("application/json");
  });
  it("omits the session header and body when not given and handles 204", async () => {
    const fetchMock = arm(new Response(null, { status: 204 }));
    const result = await demoFetch("/v1/demo/sessions/current", { method: "DELETE" });
    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
    const { init, headers } = sentRequest(fetchMock);
    expect(headers.has("x-demo-session")).toBe(false);
    expect(headers.has("content-type")).toBe(false);
    expect(init.body).toBeUndefined();
  });
  it("throws DemoApiError carrying the backend envelope on non-2xx", async () => {
    arm(
      Response.json({ code: "session_expired", message: "gone", details: null }, { status: 401 }),
    );
    const error = await demoFetch("/v1/demo/sessions/current").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DemoApiError);
    const apiError = error as DemoApiError;
    expect(apiError.status).toBe(401);
    expect(apiError.code).toBe("session_expired");
    expect(apiError.message).toBe("gone");
    expect(apiError.isInvalidSession).toBe(true);
  });
  it("still throws a DemoApiError when the error body is not JSON", async () => {
    arm(new Response("boom", { status: 502 }));
    const error = (await demoFetch("/v1/jobs").catch((e: unknown) => e)) as DemoApiError;
    expect(error.status).toBe(502);
    expect(error.code).toBe("upstream_error");
    expect(error.isInvalidSession).toBe(false);
  });
});
