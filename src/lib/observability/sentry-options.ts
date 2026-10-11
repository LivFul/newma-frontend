// Shared Sentry init options (sprint plan §4.3). The SDK stays silent until NEXT_PUBLIC_SENTRY_DSN is set.
import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { isBenignNavigationAbort } from "@/lib/observability/navigation-errors";

export type SentryEnv = { NEXT_PUBLIC_SENTRY_DSN?: string; VERCEL_ENV?: string };

const TRACES_SAMPLE_RATE = 0.1;

function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isBenignNavigationAbort(hint.originalException)) return null;
  const value = event.exception?.values?.[0]?.value;
  if (value && isBenignNavigationAbort(value)) return null;
  return event;
}

export function sentryOptions(env: SentryEnv) {
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: env.VERCEL_ENV ?? "development",
    tracesSampleRate: TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    ignoreErrors: [
      "AbortError: Transition was skipped. Navigation aborted",
      /Transition was skipped/i,
      /Navigation aborted/i,
    ],
    beforeSend,
  };
}
