// Browser-side Sentry init (@sentry/nextjs 11 replaces sentry.client.config.ts with this file).
// The SDK is imported lazily so that without NEXT_PUBLIC_SENTRY_DSN no Sentry code reaches the client
// bundle at all (guarded by scripts/check-client-bundle.mjs after `pnpm build`).
import { sentryOptions } from "@/lib/observability/sentry-options";

type SentryClient = typeof import("@sentry/nextjs");

// Literal member access is required so Next inlines the NEXT_PUBLIC_* values into the client bundle.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;

let sentry: SentryClient | undefined;

/** Resolves once the SDK is loaded and initialised (immediately when there is no DSN). */
export const sentryReady: Promise<void> = dsn
  ? import("@sentry/nextjs").then((mod) => {
      mod.init(sentryOptions({ NEXT_PUBLIC_SENTRY_DSN: dsn, VERCEL_ENV: vercelEnv }));
      sentry = mod;
    })
  : Promise.resolve();

export function onRouterTransitionStart(href: string, navigationType: string): void {
  sentry?.captureRouterTransitionStart(href, navigationType);
}
