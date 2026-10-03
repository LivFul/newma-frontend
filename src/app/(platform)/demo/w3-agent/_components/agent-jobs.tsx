import type { AgentQuery } from "@/lib/demo/types";
import { SimulatedLabel } from "../../_components/simulated-label";

const PERCENT = 100;
const JOB_STEPS = ["docking_job", "admet_job"] as const;
const STEP_PROGRESS = { pending: 0, running: 0.5, held: 0, failed: 1, done: 1 } as const;

// Only the two job steps report retries; "retrieval" must never match.
export const JOB_STEP_KEYS: ReadonlySet<string> = new Set(JOB_STEPS);
export const RETRY_PATTERN = /\bretr(?:y|ying|ied)\b/i;

/** Simulated jobs, derived from the query's steps so the page polls a single endpoint. */
export function AgentJobs({ query, retried }: { query: AgentQuery; retried: boolean }) {
  const steps = query.steps.filter((s) => (JOB_STEPS as readonly string[]).includes(s.key));
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap gap-2">
        <SimulatedLabel label="Simulated workflow engine" />
        <SimulatedLabel label="Simulated compute" />
      </p>
      {steps.map((step) => {
        const percent = Math.round(STEP_PROGRESS[step.status] * PERCENT);
        return (
          <div key={step.key} className="space-y-1">
            <p className="text-sm">
              {step.title}: {step.status}
            </p>
            <div
              role="progressbar"
              aria-label={`${step.title} progress`}
              aria-valuemin={0}
              aria-valuemax={PERCENT}
              aria-valuenow={percent}
              className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated"
            >
              <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      {retried ? (
        <p role="status" className="rounded-md border border-warning px-3 py-2 text-sm">
          Retried after simulated failure
        </p>
      ) : null}
    </div>
  );
}
