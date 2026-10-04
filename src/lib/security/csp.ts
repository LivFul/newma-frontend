// Content-Security-Policy for every route, shipped as Content-Security-Policy-Report-Only first
// (A-P4-16, closed in P6 hardening). The header comes from next.config.ts headers(), which is static,
// so the policy cannot carry per-request nonces: the Next bootstrap scripts (self.__next_f.push) and
// the JSON-LD blocks are inline, hence 'unsafe-inline' for scripts. Enforcing a nonce-based policy
// needs a proxy plus dynamic rendering of every page (node_modules/next/dist/docs, "Nonces"), which
// would give up the static homepage; that trade-off is left to a later item.
//
// There is no report-uri or report-to directive: no collection endpoint exists. Violations surface
// in the browser console and as `securitypolicyviolation` events (tests/e2e/csp.spec.ts listens).

export type CspEnv = Readonly<{
  /** NODE_ENV; development adds 'unsafe-eval' (React dev tooling) and the analytics debug script. */
  nodeEnv?: string;
  /** NEXT_PUBLIC_SENTRY_DSN; when set, the browser SDK posts events to the DSN's origin. */
  sentryDsn?: string;
}>;

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

/** Builds the policy as a single header value, directives separated by "; ". */
export function buildCsp(env: CspEnv = {}): string {
  const isDev = env.nodeEnv === "development";
  const sentry = sentryOrigin(env.sentryDsn);
  const directives: readonly (readonly [string, string])[] = [
    ["default-src", "'self'"],
    [
      "script-src",
      join(["'self'", "'unsafe-inline'", isDev && "'unsafe-eval'", isDev && ANALYTICS_DEV_ORIGIN]),
    ],
    // Motion and the hero set style attributes; Tailwind and next/font ship self-hosted stylesheets.
    ["style-src", "'self' 'unsafe-inline'"],
    // next/image and the three.js view decode into blob: and data: URLs; no remote images exist.
    ["img-src", "'self' blob: data:"],
    ["font-src", "'self'"],
    ["connect-src", join(["'self'", sentry, isDev && ANALYTICS_DEV_ORIGIN])],
    ["worker-src", "'self' blob:"],
    ["manifest-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  return directives.map(([name, value]) => `${name} ${value}`).join("; ");
}
