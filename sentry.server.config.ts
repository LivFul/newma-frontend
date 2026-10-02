// Loaded by src/instrumentation.ts for the Node.js runtime.
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/observability/sentry-options";

Sentry.init(
  sentryOptions({
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }),
);
