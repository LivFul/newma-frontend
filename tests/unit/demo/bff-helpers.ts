// Shared arming for BFF route-handler tests: demo mode on, API env set, global fetch mocked.
import { NextRequest } from "next/server";
import { vi } from "vitest";

export const TOKEN = "service-token-NEVER-IN-BODY";
export const SID = "sid-123";

export type FetchMock = ReturnType<
  typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>
>;

export function armBff(responses: Response[], demoMode = true): FetchMock {
  vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", demoMode ? "true" : "false");
  vi.stubEnv("NEWMA_API_URL", "https://api.example");
  vi.stubEnv("BFF_SERVICE_TOKEN", TOKEN);
  const queue = [...responses];
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => {
    const next = queue.shift();
    if (!next) throw new Error("unexpected fetch");
    return next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function disarmBff(): void {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
}

export type RequestOptions = Readonly<{
  method?: string;
  https?: boolean;
  cookie?: boolean;
  json?: unknown;
  form?: Record<string, string>;
  /** Sec-Fetch-Site value; defaults to same-origin for non-GET requests. `null` omits it. */
  fetchSite?: string | null;
  /** Origin header; `null` omits it. */
  origin?: string | null;
  contentType?: string;
}>;

export function bffRequest(path: string, options: RequestOptions = {}): NextRequest {
  const headers = new Headers();
  if (options.https) headers.set("x-forwarded-proto", "https");
  if (options.cookie !== false) {
    headers.set("cookie", `${options.https ? "__Host-newma_demo_sid" : "newma_demo_sid"}=${SID}`);
  }
  if (options.json !== undefined) headers.set("content-type", "application/json");
  if (options.form) headers.set("content-type", "application/x-www-form-urlencoded");
  if (options.contentType) headers.set("content-type", options.contentType);
  const method = options.method ?? "GET";
  const fetchSite =
    options.fetchSite === undefined && method !== "GET" ? "same-origin" : options.fetchSite;
  if (fetchSite) headers.set("sec-fetch-site", fetchSite);
  if (options.origin) headers.set("origin", options.origin);
  const body = options.form
    ? new URLSearchParams(options.form).toString()
    : options.json !== undefined
      ? JSON.stringify(options.json)
      : undefined;
  return new NextRequest(`http://localhost:3100${path}`, {
    method,
    headers,
    body,
  });
}

export const sentHeaders = (fetchMock: FetchMock, call = 0): Headers =>
  new Headers(fetchMock.mock.calls[call][1].headers);

export const sentUrl = (fetchMock: FetchMock, call = 0): string => fetchMock.mock.calls[call][0];

export const sentBody = (fetchMock: FetchMock, call = 0): unknown =>
  JSON.parse(String(fetchMock.mock.calls[call][1].body));

export const envelope = (code: string, status: number): Response =>
  Response.json({ code, message: `${code} message`, details: null }, { status });

export function setCookieHeader(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}
