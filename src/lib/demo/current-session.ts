import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  DemoApiError,
  type DemoFetchInit,
  type DemoFetchResult,
  type DemoPath,
  demoFetch,
} from "./api";
import { ACCESS_ROUTE, EXPIRED_ROUTE } from "./routes";
import { isSecureRequest, readSessionId } from "./session";
import type { DemoSession } from "./types";

// Server components cannot write cookies, so an expired session is sent through the BFF route
// that clears it before landing on /access?reason=expired (assumption A-P2-F03; review focus 3).
export { EXPIRED_ROUTE };

/** The session id from the HttpOnly cookie, or a redirect to /access. Never reaches the client. */
export async function requireSessionId(): Promise<string> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const sessionId = readSessionId(cookieStore, isSecureRequest(headerStore));
  if (!sessionId) redirect(ACCESS_ROUTE);
  return sessionId;
}

/** A backend call on behalf of the cookie session; an invalid session redirects to the expired route. */
export async function requireSessionFetch<T = unknown>(
  path: DemoPath,
  init: Omit<DemoFetchInit, "sessionId"> = {},
): Promise<DemoFetchResult<T>> {
  const sessionId = await requireSessionId();
  try {
    return await demoFetch<T>(path, { ...init, sessionId });
  } catch (error) {
    if (error instanceof DemoApiError && error.isInvalidSession) redirect(EXPIRED_ROUTE);
    throw error;
  }
}

/** Memoised per request (React cache): the layout and the page share one backend call. */
export const requireSession = cache(async (): Promise<DemoSession> => {
  const { data } = await requireSessionFetch<DemoSession>("/v1/demo/sessions/current");
  if (!data) throw new DemoApiError(502, { code: "upstream_error", message: "No session body." });
  return data;
});
