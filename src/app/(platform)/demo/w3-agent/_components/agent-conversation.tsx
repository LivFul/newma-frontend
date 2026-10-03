"use client";
import { useState } from "react";
import { useAgentPolling } from "@/lib/demo/use-agent-polling";
import { useJobRetries } from "@/lib/demo/use-job-retries";
import type { AgentQuery } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { AgentView } from "./agent-view";
import { JOB_STEP_KEYS, RETRY_PATTERN } from "./agent-jobs";

const sawRetry = (query: AgentQuery | undefined) =>
  query?.steps.some((step) => JOB_STEP_KEYS.has(step.key) && RETRY_PATTERN.test(step.detail)) ??
  false;

/** Live view: polls the query until completed/held/failed; stops on unmount. */
export function AgentConversation({ id, initial }: { id: string; initial?: AgentQuery }) {
  const { data, error, isPolling } = useAgentPolling(id);
  const query = data ?? initial;
  // Sticky: the retry is transient between polls, the notice stays once seen.
  const [retried, setRetried] = useState(sawRetry(initial));
  if (!retried && sawRetry(query)) setRetried(true);
  const jobsRetried = useJobRetries(query?.job_ids ?? [], query?.status === "completed");
  if (!query)
    return error ? <ErrorNotice error={error} /> : <p aria-live="polite">Loading agent query…</p>;
  return (
    <div className="space-y-3">
      {isPolling ? <p className="text-xs text-fg-muted">Polling every 2 s</p> : null}
      <ErrorNotice error={error} />
      <AgentView query={query} retried={retried || jobsRetried} />
    </div>
  );
}
