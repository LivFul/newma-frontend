import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

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
