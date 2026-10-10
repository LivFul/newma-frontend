import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { buildCsp } from "./src/lib/security/csp";

// The Content-Security-Policy ships Report-Only first (A-P4-16): violations show in the console and as
// securitypolicyviolation events; there is no report-uri because no collection endpoint exists. This
// static, nonce-free policy covers every path except /access and /demo/*, where src/proxy.ts sends a
// per-request nonce policy instead. Rationale for each directive: src/lib/security/csp.ts.
const CSP_STATIC_SOURCE = "/:path((?!access(?:/|$)|demo(?:/|$)).*)";
const CSP_REPORT_ONLY = buildCsp({
  nodeEnv: process.env.NODE_ENV,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  vercelEnv: process.env.VERCEL_ENV,
});

// Baseline security headers for every route.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
const CSP_HEADERS = [{ key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY }];

// Surfaces that must stay out of the index: robots metadata plus this header. robots.txt deliberately
// does not disallow /access, /demo or /primitives (a crawler has to fetch a page to see its noindex;
// assumption A-P4-11); /api/ is disallowed there too, and the header covers non-compliant fetchers.
const NOINDEX_SOURCES = ["/demo/:path*", "/access/:path*", "/primitives/:path*", "/api/:path*"];
const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: CSP_STATIC_SOURCE, headers: CSP_HEADERS },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      ...NOINDEX_SOURCES.map((source) => ({ source, headers: NOINDEX_HEADERS })),
    ];
  },
};

// MDX is imported by the ecosystem detail route, not routed, so pageExtensions stays at the default.
// No remark or rehype plugins: Turbopack cannot take function options and the pages need none.
const withMDX = createMDX({});
const config = withMDX(nextConfig);

// Source-map upload only when a token is present; the SDK itself is gated by NEXT_PUBLIC_SENTRY_DSN.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(config, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      bundleSizeOptimizations: { excludeDebugStatements: true },
    })
  : config;
