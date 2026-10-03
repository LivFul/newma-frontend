import type { APIRequestContext } from "@playwright/test";

// The suite runs against three kinds of target and some assertions depend on which:
//   local      a local dev or production build (no Vercel edge in front)
//   production the canonical production host
//   preview    any other deployed host (a Vercel preview: per-branch host, X-Robots-Tag: noindex)
export type TargetKind = "local" | "production" | "preview";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
export const PRODUCTION_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://newma-frontend.vercel.app"
).replace(/\/+$/, "");

export function targetKind(baseURL: string | undefined): TargetKind {
  const host = new URL(baseURL ?? "http://localhost").hostname;
  if (LOCAL_HOSTS.has(host)) return "local";
  return host === new URL(PRODUCTION_ORIGIN).hostname ? "production" : "preview";
}

/**
 * True when Next resolves static Open Graph images against the deployment's own host: on a Vercel
 * preview, or on a local build made with Vercel's system variables set to emulate one
 * (`PLAYWRIGHT_EMULATE_VERCEL_PREVIEW=1`, see the README).
 */
export const imagesUseDeploymentHost = (kind: TargetKind): boolean =>
  kind === "preview" || process.env.PLAYWRIGHT_EMULATE_VERCEL_PREVIEW === "1";

/**
 * Vercel Deployment Protection answers the first request that carries `x-vercel-set-bypass-cookie`
 * with a 307 to the same URL that sets the bypass cookie. A test that disables redirects to inspect
 * a route's own redirect would see that one instead, so make one ordinary request first and let the
 * request context keep the cookie. A no-op against a local server.
 */
export async function warmUp(request: APIRequestContext): Promise<void> {
  await request.get("/");
}
