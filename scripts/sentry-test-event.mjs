#!/usr/bin/env node
// Send one test event to Sentry (DoD item 6) so the project can be verified end to end.
// Usage: NEXT_PUBLIC_SENTRY_DSN=… node scripts/sentry-test-event.mjs
import { pathToFileURL } from "node:url";

const FLUSH_TIMEOUT_MS = 5_000;
export const TEST_MESSAGE = "newma-frontend test event";

/**
 * @param {{ NEXT_PUBLIC_SENTRY_DSN?: string; VERCEL_ENV?: string }} env
 * @param {{ init: (o: object) => unknown; captureMessage: (m: string) => string; flush: (ms: number) => Promise<boolean> }} sentry
 */
export async function sendTestEvent(env, sentry) {
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return "no DSN configured";
  sentry.init({ dsn, environment: env.VERCEL_ENV ?? "development", tracesSampleRate: 0 });
  const eventId = sentry.captureMessage(TEST_MESSAGE);
  await sentry.flush(FLUSH_TIMEOUT_MS);
  return `sent event ${eventId}`;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  // Under Node ESM the package's CJS build exposes captureMessage/flush only on `default`.
  const namespace = await import("@sentry/nextjs");
  const Sentry = namespace.default ?? namespace;
  process.stdout.write(`${await sendTestEvent(process.env, Sentry)}\n`);
}
