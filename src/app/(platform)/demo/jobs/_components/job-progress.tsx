"use client";
import { useState, useTransition } from "react";
import { Badge, Button } from "@/components/ui";
import { type Job, isTerminal } from "@/lib/demo/jobs";
import { useJobPolling } from "@/lib/demo/use-job-polling";
import { JobStateBadge } from "./job-state-badge";

const PERCENT = 100;

type CancelProps = { job: Job; onCancelled: () => Promise<void> };

// aria-busy / aria-disabled rather than `disabled`: a disabled control drops keyboard focus.
function CancelButton({ job, onCancelled }: CancelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const inactive = pending || isTerminal(job.state);
  const cancel = () => {
    if (inactive) return;
    startTransition(async () => {
      const response = await fetch(`/api/demo/jobs/${encodeURIComponent(job.id)}/cancel`, {
        method: "POST",
      }).catch(() => undefined);
      if (!response?.ok) {
        setError("Could not cancel the job.");
        return;
      }
      await onCancelled();
    });
  };
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="danger"
        size="sm"
        onClick={cancel}
        aria-busy={pending || undefined}
        aria-disabled={inactive || undefined}
      >
        Cancel job
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function JobProgress({ id, initial }: { id: string; initial?: Job }) {
  const { job: polled, error, isPolling, refetch } = useJobPolling(id);
  const job = polled ?? initial;
  if (!job) {
    return error ? <p role="alert">{error.message}</p> : <p aria-live="polite">Loading job…</p>;
  }
  const percent = Math.round(Math.min(Math.max(job.progress, 0), 1) * PERCENT);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <JobStateBadge state={job.state} />
        <Badge>Simulated workflow engine</Badge>
        <Badge>Simulated compute</Badge>
        {isPolling ? <span className="text-xs text-fg-muted">Polling every 2 s</span> : null}
      </div>
      <div
        role="progressbar"
        aria-label="Job progress"
        aria-valuemin={0}
        aria-valuemax={PERCENT}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="h-3 w-full overflow-hidden rounded-full bg-bg-elevated"
      >
        <div className="h-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm" data-testid="job-progress-text">
        {percent}% · attempt {job.attempts + 1} of {job.max_attempts}
      </p>
      {job.attempts > 0 ? (
        <p role="status" className="rounded-md border border-warning px-3 py-2 text-sm">
          Retried {job.attempts} time{job.attempts === 1 ? "" : "s"} after a simulated failure.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error.message}
        </p>
      ) : null}
      <CancelButton job={job} onCancelled={refetch} />
    </div>
  );
}
