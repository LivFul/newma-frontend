import "server-only";
import { createApiClient, type ApiClient } from "@/lib/api/server";

// Server-only access to the Railway API (D-09/D-10). `demoFetch` is the typed wrapper the BFF uses
// until the backend P2 spec is re-exported into the generated `paths` (plan P2, Task 7).

export type DemoErrorEnvelope = Readonly<{ code: string; message: string; details?: unknown }>;

const INVALID_SESSION_CODES: ReadonlySet<string> = new Set(["invalid_session", "session_expired"]);

export class DemoApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, envelope: DemoErrorEnvelope) {
    super(envelope.message);
    this.name = "DemoApiError";
    this.status = status;
    this.code = envelope.code;
    this.details = envelope.details;
  }

  get isInvalidSession(): boolean {
    return this.status === 401 && INVALID_SESSION_CODES.has(this.code);
  }
}

type DemoEnv = Readonly<{ baseUrl: string; serviceToken: string }>;

function requireEnv(name: "NEWMA_API_URL" | "BFF_SERVICE_TOKEN"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; the demo BFF cannot reach the API.`);
  return value;
}

function readDemoEnv(): DemoEnv {
  return { baseUrl: requireEnv("NEWMA_API_URL"), serviceToken: requireEnv("BFF_SERVICE_TOKEN") };
}

export function demoApi(sessionId?: string, fetchImpl?: typeof fetch): ApiClient {
  const { baseUrl, serviceToken } = readDemoEnv();
  return createApiClient({ baseUrl, serviceToken, sessionId, fetch: fetchImpl });
}

export type DemoFetchInit = Readonly<{
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  sessionId?: string;
}>;

export type DemoFetchResult<T> = Readonly<{
  status: number;
  data: T | undefined;
  headers: Headers;
}>;

function buildHeaders(serviceToken: string, init: DemoFetchInit): Headers {
  const headers = new Headers({ Authorization: `Bearer ${serviceToken}` });
  if (init.sessionId) headers.set("X-Demo-Session", init.sessionId);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  return headers;
}

async function parseError(response: Response): Promise<DemoErrorEnvelope> {
  const fallback = { code: "upstream_error", message: `API responded ${response.status}` };
  const body: unknown = await response.json().catch(() => undefined);
  if (typeof body !== "object" || body === null) return fallback;
  const { code, message, details } = body as Partial<DemoErrorEnvelope>;
  return typeof code === "string" && typeof message === "string"
    ? { code, message, details }
    : fallback;
}

export async function demoFetch<T = unknown>(
  path: string,
  init: DemoFetchInit = {},
): Promise<DemoFetchResult<T>> {
  const { baseUrl, serviceToken } = readDemoEnv();
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: buildHeaders(serviceToken, init),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!response.ok) throw new DemoApiError(response.status, await parseError(response));
  const data = response.status === 204 ? undefined : ((await response.json()) as T);
  return { status: response.status, data, headers: response.headers };
}
