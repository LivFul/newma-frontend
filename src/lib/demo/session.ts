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

/** Production and every Vercel environment are https; locally trust the proxy header or the URL. */
export function isSecureRequest(headers: Headers, url?: string): boolean {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV) return true;
  const forwarded = headers.get("x-forwarded-proto");
  if (forwarded) return forwarded === "https";
  return url ? new URL(url).protocol === "https:" : false;
}

/** The origin the browser sees, derived from the proxy headers when present. */
export function requestOrigin(headers: Headers, url: string): string {
  const parsed = new URL(url);
  const host = headers.get("x-forwarded-host") ?? parsed.host;
  const proto = headers.get("x-forwarded-proto") ?? parsed.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}

export function readSessionId(cookieStore: CookieReader, secure: boolean): string | undefined {
  const value = cookieStore.get(sessionCookieName(secure))?.value;
  return value ? value : undefined;
}
