import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { DemoApiError } from "./api";
import type { DemoErrorEnvelope } from "./types";
import { isDemoMode } from "./mode";
import { isSecureRequest, readSessionId, requestOrigin, sessionCookieName } from "./session";

// Shared plumbing for the BFF route handlers under src/app/api/demo/ (D-09, D-10).

export type ErrorBody = DemoErrorEnvelope;

/** A request the BFF rejects before reaching the backend; mapped to its status by the wrappers. */
export class BffError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BffError";
  }
}

export function noStore(body: unknown, init: ResponseInit = {}): NextResponse {
  const response =
    body === undefined
      ? new NextResponse(null, { ...init, status: 204 })
      : NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** 303 with a relative Location: the browser resolves it against the origin it is on. */
export function seeOther(path: `/${string}`): NextResponse {
  const response = new NextResponse(null, { status: 303, headers: { Location: path } });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function errorJson(status: number, code: string, message: string): NextResponse {
  return noStore({ code, message } satisfies ErrorBody, { status });
}

/** 404 when the demo is switched off; the demo surface then does not exist (prompt §3.3). */
export function demoGuard(): NextResponse | undefined {
  return isDemoMode() ? undefined : errorJson(404, "not_found", "Not found.");
}

export function clearSessionCookie<R extends NextResponse>(response: R, secure: boolean): R {
  response.cookies.set(sessionCookieName(secure), "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export type SessionContext = Readonly<{ req: NextRequest; sessionId: string; secure: boolean }>;

export type SessionHandler = (ctx: SessionContext) => Promise<NextResponse>;

const SAME_ORIGIN_FETCH_SITES: ReadonlySet<string> = new Set(["same-origin", "none"]);

/**
 * Non-GET requests must come from this origin: Sec-Fetch-Site same-origin/none, or an Origin
 * header equal to the request origin (SameSite=Lax alone does not stop a top-level cross-site POST).
 */
export function sameOriginGuard(req: NextRequest): NextResponse | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && SAME_ORIGIN_FETCH_SITES.has(fetchSite)) return undefined;
  const origin = req.headers.get("origin");
  if (!fetchSite && origin && origin === requestOrigin(req.headers, req.url)) return undefined;
  return errorJson(403, "cross_site_request", "Cross-site requests are not accepted.");
}

// Backend `details` reach the browser only for codes whose details are safe to render.
const DETAILS_ALLOWLIST: ReadonlySet<string> = new Set([
  "job_terminal",
  "validation_error",
  "idempotency_conflict",
]);
const UPSTREAM_UNAVAILABLE = "The demo backend is unavailable";

function upstreamError(error: unknown): NextResponse {
  // Full error server-side (no request headers are ever attached to these errors).
  console.error("demo BFF upstream failure", error);
  return errorJson(502, "upstream_error", UPSTREAM_UNAVAILABLE);
}

function mapError(error: unknown, secure: boolean): NextResponse {
  if (error instanceof BffError) return errorJson(error.status, error.code, error.message);
  if (!(error instanceof DemoApiError) || error.status >= 500) return upstreamError(error);
  const base = { code: error.code, message: error.message };
  const body: ErrorBody = DETAILS_ALLOWLIST.has(error.code)
    ? { ...base, details: error.details }
    : base;
  const response = noStore(body, { status: error.status });
  return error.isInvalidSession ? clearSessionCookie(response, secure) : response;
}

/** Resolves the HttpOnly session cookie and maps backend session errors to a cookie-clearing 401. */
export function withSession(handler: SessionHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const off = demoGuard() ?? sameOriginGuard(req);
    if (off) return off;
    const secure = isSecureRequest(req.headers, req.url);
    const sessionId = readSessionId(req.cookies, secure);
    if (!sessionId) return errorJson(401, "no_session", "Sign in at /access first.");
    try {
      return await handler({ req, sessionId, secure });
    } catch (error) {
      return mapError(error, secure);
    }
  };
}

/** Like withSession but for handlers that need no session (session creation). */
export function withDemo(handler: (req: NextRequest, secure: boolean) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const off = demoGuard() ?? sameOriginGuard(req);
    if (off) return off;
    const secure = isSecureRequest(req.headers, req.url);
    try {
      return await handler(req, secure);
    } catch (error) {
      return mapError(error, secure);
    }
  };
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function isSafeId(value: string): boolean {
  return SAFE_ID.test(value);
}

const JSON_CONTENT_TYPE = /^application\/json(\s*;|$)/i;

/** Parses a JSON body; a missing or different Content-Type is a 415 before any parsing. */
export async function readJson(req: NextRequest): Promise<unknown> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!JSON_CONTENT_TYPE.test(contentType)) {
    throw new BffError(415, "unsupported_media_type", "Send application/json.");
  }
  return req.json().catch(() => undefined);
}
