"use client";
import { useEffect, useState } from "react";
import { type Job, isTerminal } from "./jobs";

// Client polling against the BFF (D-10). Every 2 s until a terminal state; aborts on unmount.
export const DEFAULT_POLL_INTERVAL_MS = 2000;

export type PollingError = Readonly<{ code: string; message: string }>;

export type JobPollingState = Readonly<{
  job: Job | undefined;
  error: PollingError | undefined;
  isPolling: boolean;
}>;

type PollOutcome =
  | Readonly<{ kind: "job"; job: Job }>
  | Readonly<{ kind: "error"; error: PollingError; fatal: boolean }>
  | Readonly<{ kind: "aborted" }>;

const NETWORK_ERROR: PollingError = { code: "network_error", message: "Network error; retrying." };

async function readError(response: Response): Promise<PollingError> {
  const body = (await response.json().catch(() => undefined)) as Partial<PollingError> | undefined;
  return typeof body?.code === "string" && typeof body.message === "string"
    ? { code: body.code, message: body.message }
    : { code: "upstream_error", message: `Polling failed (${response.status}).` };
}

async function pollOnce(id: string, signal: AbortSignal): Promise<PollOutcome> {
  try {
    const response = await fetch(`/api/demo/jobs/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal,
    });
    if (response.ok) return { kind: "job", job: (await response.json()) as Job };
    // 401/404 will not heal by waiting; 5xx may.
    return { kind: "error", error: await readError(response), fatal: response.status < 500 };
  } catch (error) {
    if (signal.aborted) return { kind: "aborted" };
    void error;
    return { kind: "error", error: NETWORK_ERROR, fatal: false };
  }
}

type Tracked = Readonly<{ id: string; state: JobPollingState }>;

const INITIAL: JobPollingState = { job: undefined, error: undefined, isPolling: true };

function applyOutcome(state: JobPollingState, outcome: PollOutcome): JobPollingState {
  if (outcome.kind === "aborted") return state;
  if (outcome.kind === "job") {
    return { job: outcome.job, error: undefined, isPolling: !isTerminal(outcome.job.state) };
  }
  return { ...state, error: outcome.error, isPolling: !outcome.fatal };
}

export function useJobPolling(
  id: string,
  { intervalMs = DEFAULT_POLL_INTERVAL_MS }: { intervalMs?: number } = {},
): JobPollingState {
  // State is keyed by job id so a new id resets during render rather than inside the effect.
  const [tracked, setTracked] = useState<Tracked>({ id, state: INITIAL });
  if (tracked.id !== id) setTracked({ id, state: INITIAL });
  const setState = (update: (previous: JobPollingState) => JobPollingState) =>
    setTracked((previous) => ({ id: previous.id, state: update(previous.state) }));

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (keepGoing: boolean) => {
      if (keepGoing && !controller.signal.aborted) timer = setTimeout(run, intervalMs);
    };
    const run = async () => {
      const outcome = await pollOnce(id, controller.signal);
      if (controller.signal.aborted) return;
      const next = applyOutcome(INITIAL, outcome);
      setState((previous) => applyOutcome(previous, outcome));
      schedule(next.isPolling);
    };
    void run();

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [id, intervalMs]);

  return tracked.id === id ? tracked.state : INITIAL;
}
