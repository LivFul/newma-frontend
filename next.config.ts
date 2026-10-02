import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Baseline security headers for every route. A Content-Security-Policy is deliberately absent until
// P4 decides the hero/analytics origins.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

// Source-map upload only when a token is present; the SDK itself is gated by NEXT_PUBLIC_SENTRY_DSN.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      bundleSizeOptimizations: { excludeDebugStatements: true },
    })
  : nextConfig;
