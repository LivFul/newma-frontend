"use client";
import { type Job, isTerminal } from "./jobs";
import { type PollingError, DEFAULT_POLL_INTERVAL_MS, usePolling } from "./use-polling";

// Client polling of one job against the BFF (D-10): a thin wrapper over the generic usePolling.
export { DEFAULT_POLL_INTERVAL_MS, type PollingError };

export type JobPollingState = Readonly<{
  job: Job | undefined;
  error: PollingError | undefined;
  isPolling: boolean;
}>;

export type JobPolling = JobPollingState & Readonly<{ refetch: () => Promise<void> }>;

const jobIsTerminal = (job: Job) => isTerminal(job.state);

export function useJobPolling(
  id: string,
  { intervalMs = DEFAULT_POLL_INTERVAL_MS }: { intervalMs?: number } = {},
): JobPolling {
  const { data, error, isPolling, refetch } = usePolling<Job>(
    `/api/demo/jobs/${encodeURIComponent(id)}`,
    jobIsTerminal,
    { intervalMs },
  );
  return { job: data, error, isPolling, refetch };
}
