import "server-only";

// Canonical site origin for metadata, sitemap, robots and JSON-LD (assumption A-P4-10).
// Server-only: metadata, sitemap, robots and JSON-LD read it at build or request time on the server.
// NEXT_PUBLIC_SITE_URL is inlined at build; VERCEL_PROJECT_PRODUCTION_URL is read from the server env.
export const SITE_NAME = "NEWMA";
export const FALLBACK_SITE_URL = "https://newma-frontend.vercel.app";
// Flip once privacy and terms text is approved at CP-2 (assumption A-P4-03): until then the legal
// pages are noindex and out of the sitemap.
export const LEGAL_APPROVED = false;

export type SiteEnv = Readonly<{
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  NODE_ENV?: string;
}>;

// Literal member accesses so the bundler can inline the values.
const buildEnv = (): SiteEnv => ({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  NODE_ENV: process.env.NODE_ENV,
});

const clean = (value: string | undefined): string => (value ?? "").trim().replace(/\/+$/, "");

function candidate(env: SiteEnv): string {
  const explicit = clean(env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;
  const vercelHost = clean(env.VERCEL_PROJECT_PRODUCTION_URL);
  // Vercel exposes the production host without a scheme. VERCEL_URL (per deployment) is never used.
  return vercelHost ? `https://${vercelHost}` : FALLBACK_SITE_URL;
}

export function siteUrl(env: SiteEnv = buildEnv()): string {
  const url = candidate(env);
  if (!/^https?:\/\//.test(url)) throw new Error(`Site URL must be absolute, got "${url}".`);
  if (url.startsWith("http://") && env.NODE_ENV === "production") {
    throw new Error("Site URL must use https in production builds.");
  }
  return url;
}

export function absoluteUrl(path: string, env: SiteEnv = buildEnv()): string {
  return `${siteUrl(env)}${path.startsWith("/") ? path : `/${path}`}`;
}
