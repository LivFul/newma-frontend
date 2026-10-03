import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Baseline security headers for every route. A Content-Security-Policy stays deferred to the
// deploy-hardening item (assumption A-P4-16): the Next runtime scripts need nonces or hashes (JSON-LD
// data blocks do not). Ship it as Content-Security-Policy-Report-Only first.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Surfaces that must stay out of the index: robots metadata plus this header. robots.txt deliberately
// does not disallow /access, /demo or /primitives (a crawler has to fetch a page to see its noindex;
// assumption A-P4-11); /api/ is disallowed there too, and the header covers non-compliant fetchers.
const NOINDEX_SOURCES = ["/demo/:path*", "/access/:path*", "/primitives/:path*", "/api/:path*"];
const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // /ecosystem has no index page: send a trimmed URL to the components list instead of a 404.
  async redirects() {
    return [{ source: "/ecosystem", destination: "/#components", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
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
