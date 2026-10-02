"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EXPIRED_ROUTE } from "./routes";

// Generic client polling against the BFF: every 2 s until `isTerminal`, aborts on unmount (D-10).
export const DEFAULT_POLL_INTERVAL_MS = 2000;

export type PollingError = Readonly<{ code: string; message: string }>;

export type PollingState<T> = Readonly<{
  data: T | undefined;
  error: PollingError | undefined;
  isPolling: boolean;
}>;

export type Polling<T> = PollingState<T> & Readonly<{ refetch: () => Promise<void> }>;

type PollOutcome<T> =
  | Readonly<{ kind: "data"; data: T }>
  | Readonly<{ kind: "error"; error: PollingError; fatal: boolean; expired: boolean }>
  | Readonly<{ kind: "aborted" }>;

// 5xx, request timeout and rate limiting may heal by waiting; other 4xx will not.
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 429]);
const isRetryable = (status: number) => status >= 500 || RETRYABLE_STATUSES.has(status);

const NETWORK_ERROR: PollingError = { code: "network_error", message: "Network error; retrying." };

async function readError(response: Response): Promise<PollingError> {
  const body = (await response.json().catch(() => undefined)) as Partial<PollingError> | undefined;
  return typeof body?.code === "string" && typeof body.message === "string"
    ? { code: body.code, message: body.message }
    : { code: "upstream_error", message: `Polling failed (${response.status}).` };
}

async function pollOnce<T>(url: string, signal: AbortSignal): Promise<PollOutcome<T>> {
  try {
    const response = await fetch(url, { cache: "no-store", signal });
    if (response.ok) return { kind: "data", data: (await response.json()) as T };
    return {
      kind: "error",
      error: await readError(response),
      fatal: !isRetryable(response.status),
      expired: response.status === 401,
    };
  } catch {
    if (signal.aborted) return { kind: "aborted" };
    return { kind: "error", error: NETWORK_ERROR, fatal: false, expired: false };
  }
}

function applyOutcome<T>(
  state: PollingState<T>,
  outcome: PollOutcome<T>,
  isTerminal: (data: T) => boolean,
): PollingState<T> {
  if (outcome.kind === "aborted") return state;
  if (outcome.kind === "data") {
    return { data: outcome.data, error: undefined, isPolling: !isTerminal(outcome.data) };
  }
  return { ...state, error: outcome.error, isPolling: !outcome.fatal };
}

type Tracked<T> = Readonly<{ url: string | undefined; state: PollingState<T> }>;

const initial = <T>(url: string | undefined): PollingState<T> => ({
  data: undefined,
  error: undefined,
  isPolling: url !== undefined,
});

export function usePolling<T>(
  url: string | undefined,
  isTerminal: (data: T) => boolean,
  { intervalMs = DEFAULT_POLL_INTERVAL_MS }: { intervalMs?: number } = {},
): Polling<T> {
  // `isTerminal` must be a stable (module-level) predicate: it is not an effect dependency.
  // State is keyed by url so a new url resets during render rather than inside the effect.
  const router = useRouter();
  const [tracked, setTracked] = useState<Tracked<T>>({ url, state: initial(url) });
  if (tracked.url !== url) setTracked({ url, state: initial(url) });
  // An outcome only lands on the url it was fetched for (a refetch may outlive a url change).
  const update = (target: string, outcome: PollOutcome<T>) =>
    setTracked((previous) =>
      previous.url === target
        ? { url: previous.url, state: applyOutcome(previous.state, outcome, isTerminal) }
        : previous,
    );

  useEffect(() => {
    if (url === undefined) return undefined;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      const outcome = await pollOnce<T>(url, controller.signal);
      if (controller.signal.aborted) return;
      update(url, outcome);
      if (outcome.kind === "error" && outcome.expired) router.push(EXPIRED_ROUTE);
      const next = applyOutcome(initial<T>(url), outcome, isTerminal);
      if (next.isPolling && !controller.signal.aborted) timer = setTimeout(run, intervalMs);
    };
    void run();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
    // isTerminal is expected to be a stable module-level predicate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, intervalMs, router]);

  const refetch = async () => {
    if (url === undefined) return;
    update(url, await pollOnce<T>(url, new AbortController().signal));
  };

  return { ...(tracked.url === url ? tracked.state : initial<T>(url)), refetch };
}
