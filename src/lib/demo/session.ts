// Demo session cookie helpers (P2 review focus 1). `__Host-` needs Secure + Path=/ + no Domain, so
// plain-http `next dev` falls back to the unprefixed name (assumption A-P2-F02).
export const SESSION_COOKIE_HOST = "__Host-newma_demo_sid";
export const SESSION_COOKIE_DEV = "newma_demo_sid";

export type SessionCookieName = typeof SESSION_COOKIE_HOST | typeof SESSION_COOKIE_DEV;

export type SessionCookieOptions = Readonly<{
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}>;

/** Minimal shape shared by `cookies()` and `NextRequest.cookies`. */
export type CookieReader = { get(name: string): { value: string } | undefined };

export function sessionCookieName(secure: boolean): SessionCookieName {
  return secure ? SESSION_COOKIE_HOST : SESSION_COOKIE_DEV;
}

export function sessionCookieOptions(secure: boolean, maxAgeSeconds: number): SessionCookieOptions {
  return { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: maxAgeSeconds };
}

export function isSecureRequest(headers: Headers): boolean {
  return headers.get("x-forwarded-proto") === "https";
}

export function readSessionId(cookieStore: CookieReader, secure: boolean): string | undefined {
  const value = cookieStore.get(sessionCookieName(secure))?.value;
  return value ? value : undefined;
}
