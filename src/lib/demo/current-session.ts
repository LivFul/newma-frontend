import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DemoApiError, demoFetch } from "./api";
import { isSecureRequest, readSessionId } from "./session";
import type { DemoSession } from "./types";

// Server components cannot write cookies, so an expired session is sent through the BFF route
// that clears it before landing on /access?reason=expired (assumption A-P2-F03; review focus 3).
export const EXPIRED_ROUTE = "/api/demo/sessions/expired";

export async function requireSession(): Promise<DemoSession> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const sessionId = readSessionId(cookieStore, isSecureRequest(headerStore));
  if (!sessionId) redirect("/access");
  try {
    const { data } = await demoFetch<DemoSession>("/v1/demo/sessions/current", { sessionId });
    if (!data) throw new DemoApiError(502, { code: "upstream_error", message: "No session body." });
    return data;
  } catch (error) {
    if (error instanceof DemoApiError && error.isInvalidSession) redirect(EXPIRED_ROUTE);
    throw error;
  }
}
