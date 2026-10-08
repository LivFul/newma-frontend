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

// One answer per worker: the server under test does not change during a run.
let nextDev: Promise<boolean> | undefined;

/**
 * True when the server under test is `next dev`. Dev differs from a build in ways some specs assert
 * on (the CSP allows 'unsafe-eval', static metadata images resolve against the local host, build
 * chunks are not immutable), so those specs skip or narrow there and the preview-e2e job covers the
 * build. Read from the server, not the environment: locally Playwright reuses whatever already
 * listens on the port, which may be `pnpm start`. Only dev pages load Next's devtools chunk.
 */
export function servesNextDev(request: APIRequestContext): Promise<boolean> {
  nextDev ??= request
    .get("/")
    .then(async (response) => {
      // A failed probe must not read as "a build": the spec would then assert production behaviour.
      if (!response.ok()) throw new Error(`servesNextDev: GET / answered ${response.status()}`);
      return (await response.text()).includes("next-devtools");
    })
    .catch((error: unknown) => {
      nextDev = undefined; // Let the next spec probe again instead of reusing the failure.
      throw error;
    });
  return nextDev;
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
