import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { DemoApiError } from "./api";
import type { DemoErrorEnvelope } from "./types";
import { isDemoMode } from "./mode";
import { isSecureRequest, readSessionId, sessionCookieName } from "./session";

// Shared plumbing for the BFF route handlers under src/app/api/demo/ (D-09, D-10).

export type ErrorBody = DemoErrorEnvelope;

export function noStore(body: unknown, init: ResponseInit = {}): NextResponse {
  const response = NextResponse.json(body, init);
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

function mapError(error: unknown, secure: boolean): NextResponse {
  if (error instanceof DemoApiError) {
    const body: ErrorBody = { code: error.code, message: error.message, details: error.details };
    const response = noStore(body, { status: error.status });
    return error.isInvalidSession ? clearSessionCookie(response, secure) : response;
  }
  console.error("demo BFF upstream failure", error);
  return errorJson(502, "upstream_error", "The demo API could not be reached.");
}

/** Resolves the HttpOnly session cookie and maps backend session errors to a cookie-clearing 401. */
export function withSession(handler: SessionHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const off = demoGuard();
    if (off) return off;
    const secure = isSecureRequest(req.headers);
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
    const off = demoGuard();
    if (off) return off;
    const secure = isSecureRequest(req.headers);
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

export async function readJson(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => undefined);
}
