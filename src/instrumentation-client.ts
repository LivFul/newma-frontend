// Browser-side Sentry init (@sentry/nextjs 11 replaces sentry.client.config.ts with this file).
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/observability/sentry-options";

// Literal member access is required so Next inlines the NEXT_PUBLIC_* values into the client bundle.
Sentry.init(
  sentryOptions({
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  }),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
