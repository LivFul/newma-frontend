import { type NextRequest, NextResponse } from "next/server";
import { isPersonaId } from "@/lib/personas";
import { demoFetch } from "@/lib/demo/api";
import {
  clearSessionCookie,
  errorJson,
  noStore,
  readJson,
  withDemo,
  withSession,
} from "@/lib/demo/bff";
import { sessionCookieName, sessionCookieOptions } from "@/lib/demo/session";
import type { SessionCreated } from "@/lib/demo/types";

const FALLBACK_MAX_AGE_SECONDS = 8 * 60 * 60;
const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";

const isFormPost = (req: NextRequest) =>
  (req.headers.get("content-type") ?? "").startsWith(FORM_CONTENT_TYPE);

async function readPersona(req: NextRequest, form: boolean): Promise<unknown> {
  if (form) return (await req.formData()).get("persona");
  const body = await readJson(req);
  return typeof body === "object" && body !== null
    ? (body as { persona?: unknown }).persona
    : undefined;
}

function maxAgeFrom(expiresAt: string): number {
  const seconds = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : FALLBACK_MAX_AGE_SECONDS;
}

function invalidPersona(req: NextRequest, form: boolean): NextResponse {
  return form
    ? NextResponse.redirect(new URL("/access?reason=invalid", req.url), 303)
    : errorJson(400, "invalid_persona", "Unknown persona.");
}

/** POST: create a demo session. Form posts (from /access) get a 303 to /demo; JSON gets 201. */
export const POST = withDemo(async (req, secure) => {
  const form = isFormPost(req);
  const persona = await readPersona(req, form);
  if (!isPersonaId(persona)) return invalidPersona(req, form);
  const { data } = await demoFetch<SessionCreated>("/v1/demo/sessions", {
    method: "POST",
    body: { persona },
  });
  if (!data) return errorJson(502, "upstream_error", "The demo API returned no session.");
  const { session_id, ...publicSession } = data;
  const response = form
    ? NextResponse.redirect(new URL("/demo", req.url), 303)
    : noStore(publicSession, { status: 201 });
  response.cookies.set(
    sessionCookieName(secure),
    session_id,
    sessionCookieOptions(secure, maxAgeFrom(data.expires_at)),
  );
  return response;
});

const signedOut = (secure: boolean) =>
  clearSessionCookie(new NextResponse(null, { status: 204 }), secure);

const revoke = withSession(async ({ sessionId, secure }) => {
  await demoFetch("/v1/demo/sessions/current", { method: "DELETE", sessionId });
  return signedOut(secure);
});

/** DELETE: sign out. Always clears the cookie; a backend 401 or missing cookie is still a 204. */
export const DELETE = withDemo(async (req, secure) => {
  const response = await revoke(req);
  return response.status === 401 ? signedOut(secure) : response;
});
