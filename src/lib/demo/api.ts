import "server-only";
import type { paths } from "@/lib/api/generated/schema";
import { createApiClient, type ApiClient } from "@/lib/api/server";
import type { DemoErrorEnvelope } from "./types";

// Server-only access to the Railway API (D-09/D-10). `demoFetch` is a thin wrapper whose paths are
// the generated contract's; `{job_id}` templates accept a concrete id.

type TemplatePath<P extends string> = P extends `${infer Head}{${string}}${infer Tail}`
  ? `${Head}${string}${TemplatePath<Tail>}`
  : P;
export type DemoPath = TemplatePath<keyof paths & string>;
export type { DemoErrorEnvelope };

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
  /** Query parameters; undefined values are omitted. Values are URL-encoded here. */
  query?: Readonly<Record<string, string | undefined>>;
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

function queryString(query: DemoFetchInit["query"]): string {
  if (!query) return "";
  const entries = Object.entries(query).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  return entries.length === 0 ? "" : `?${new URLSearchParams(entries).toString()}`;
}

export async function demoFetch<T = unknown>(
  path: DemoPath,
  init: DemoFetchInit = {},
): Promise<DemoFetchResult<T>> {
  const { baseUrl, serviceToken } = readDemoEnv();
  const url = `${baseUrl.replace(/\/$/, "")}${path}${queryString(init.query)}`;
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
