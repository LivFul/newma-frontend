// Content-Security-Policy, shipped as Content-Security-Policy-Report-Only first (A-P4-16, closed in
// P6 hardening). Two deliveries, one builder:
//
// - Dynamic pages (/access, /demo/*) get a per-request nonce from src/proxy.ts. Next reads the nonce
//   from the request's CSP header and stamps it on its own scripts, so script-src is
//   'self' 'nonce-…' 'strict-dynamic' with no 'unsafe-inline'.
// - Static pages (/, /ecosystem/*, /legal/*, /primitives) get the header from next.config.ts. They are
//   prerendered at build time, when no nonce exists, and the inline Next bootstrap scripts
//   (self.__next_f.push) differ per page and per build, so hashes cannot be listed in a static header
//   either. Their script-src keeps 'unsafe-inline'. Nonces there would mean rendering every public page
//   per request (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md, "Static vs
//   Dynamic Rendering"), giving up CDN caching and the LCP budget of DoD item 1; experimental SRI only
//   covers external files. Those pages take no user input and render no user content, which is what
//   leaves 'unsafe-inline' exploitable, so the residual risk is accepted (A-P6H-F-03).
//
// style-src keeps 'unsafe-inline' on both: Motion and the hero write style attributes, which a nonce
// cannot cover. There is no scheme-only or wildcard source anywhere. There is no report-uri or
// report-to directive: no collection endpoint exists. Violations surface in the browser console and as
// `securitypolicyviolation` events (tests/e2e/csp.spec.ts listens for them).

export type CspEnv = Readonly<{
  /** NODE_ENV; development adds 'unsafe-eval' (React dev tooling) and the analytics debug script. */
  nodeEnv?: string;
  /** NEXT_PUBLIC_SENTRY_DSN; when set, the browser SDK posts events to the DSN's origin. */
  sentryDsn?: string;
  /** Per-request nonce from src/proxy.ts (base64); replaces 'unsafe-inline' in script-src. */
  nonce?: string;
}>;

const NONCE = /^[A-Za-z0-9+/=]{16,}$/;

// Vercel Analytics serves /_vercel/insights/script.js first-party in production; in development the
// package loads its debug script from this origin instead.
const ANALYTICS_DEV_ORIGIN = "https://va.vercel-scripts.com";

/** The DSN's origin, or undefined for an empty or malformed value (never the DSN's key). */
export function sentryOrigin(dsn: string | undefined): string | undefined {
  const value = dsn?.trim();
  if (!value) return undefined;
  try {
    const { protocol, origin } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? origin : undefined;
  } catch {
    return undefined;
  }
}

const join = (sources: readonly (string | undefined | false)[]) =>
  sources.filter((s): s is string => typeof s === "string" && s.length > 0).join(" ");

function scriptSources(isDev: boolean, nonce: string | undefined): string {
  if (nonce !== undefined && !NONCE.test(nonce)) throw new Error("CSP nonce must be base64");
  const inline = nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : ["'unsafe-inline'"];
  return join(["'self'", ...inline, isDev && "'unsafe-eval'", isDev && ANALYTICS_DEV_ORIGIN]);
}

/** Builds the policy as a single header value, directives separated by "; ". */
export function buildCsp(env: CspEnv = {}): string {
  const isDev = env.nodeEnv === "development";
  const sentry = sentryOrigin(env.sentryDsn);
  const directives: readonly (readonly [string, string])[] = [
    ["default-src", "'self'"],
    ["script-src", scriptSources(isDev, env.nonce)],
    // Motion and the hero set style attributes; Tailwind and next/font ship self-hosted stylesheets.
    ["style-src", "'self' 'unsafe-inline'"],
    // No remote, data: or blob: images: the three.js view draws to a canvas (probed in P6 hardening).
    ["img-src", "'self'"],
    ["font-src", "'self'"],
    ["connect-src", join(["'self'", sentry, isDev && ANALYTICS_DEV_ORIGIN])],
    ["worker-src", "'self'"],
    ["manifest-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  return directives.map(([name, value]) => `${name} ${value}`).join("; ");
}
