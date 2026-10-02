// Shared Sentry init options (sprint plan §4.3). The SDK stays silent until NEXT_PUBLIC_SENTRY_DSN is set.
export type SentryEnv = { NEXT_PUBLIC_SENTRY_DSN?: string; VERCEL_ENV?: string };

const TRACES_SAMPLE_RATE = 0.1;

export function sentryOptions(env: SentryEnv) {
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: env.VERCEL_ENV ?? "development",
    tracesSampleRate: TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  } as const;
}
