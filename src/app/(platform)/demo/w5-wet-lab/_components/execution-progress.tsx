"use client";
import { useJobPolling } from "@/lib/demo/use-job-polling";
import { SimulatedLabel } from "../../_components/simulated-label";

const PERCENT = 100;

/** The simulated wet-lab execution job (kind eln_execution, A-P3-10). */
export function ExecutionProgress({ jobId }: { jobId: string }) {
  const { job, error } = useJobPolling(jobId);
  const percent = Math.round(Math.min(Math.max(job?.progress ?? 0, 0), 1) * PERCENT);
  return (
    <div className="space-y-2">
      <p className="flex flex-wrap gap-2">
        <SimulatedLabel label="Simulated workflow engine" />
        <SimulatedLabel label="Simulated compute" />
        <span className="text-sm">{job ? job.state : "loading"}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Lab execution progress"
        aria-valuemin={0}
        aria-valuemax={PERCENT}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated"
      >
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      {error ? <p className="text-sm text-danger">{error.message}</p> : null}
    </div>
  );
}
