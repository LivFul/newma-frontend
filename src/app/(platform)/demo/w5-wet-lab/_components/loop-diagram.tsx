import type { LoopState } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";

// TA §3 loop as two accessible ordered lists (A-P3-17): the assay branch and the learning branch.
const ASSAY: readonly LoopState[] = [
  "authorization",
  "prioritization",
  "material_gate",
  "assay_request",
  "wet_lab_validation",
  "results_ingestion",
  "evidence_review",
  "assay_gate",
  "confirmed_hit",
];
const LEARNING: readonly LoopState[] = ["reviewed_update", "prioritization", "retraining_review"];

function Branch({
  label,
  states,
  current,
}: {
  label: string;
  states: readonly LoopState[];
  current: LoopState | null;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">{label}</h3>
      <ol aria-label={label} className="flex flex-wrap gap-2 text-xs">
        {states.map((state) => (
          <li
            key={state}
            aria-current={state === current ? "step" : undefined}
            className="rounded-sm border border-border px-2 py-1 aria-[current=step]:border-accent aria-[current=step]:bg-accent aria-[current=step]:text-accent-fg"
          >
            {humanize(state)}
          </li>
        ))}
      </ol>
    </div>
  );
}

type Props = Readonly<{ assayState: LoopState; learningState: LoopState | null }>;

export function LoopDiagram({ assayState, learningState }: Props) {
  return (
    <div
      className="space-y-3"
      data-testid="loop-diagram"
      data-assay-state={assayState}
      data-learning-state={learningState ?? ""}
    >
      {assayState === "hold" ? (
        <p
          data-testid="loop-hold"
          className="rounded-md border border-warning px-3 py-2 text-sm font-semibold"
        >
          Hold: the loop is paused until the hold is resolved.
        </p>
      ) : null}
      <Branch label="Assay branch" states={ASSAY} current={assayState} />
      <Branch label="Learning branch" states={LEARNING} current={learningState} />
      <p className="text-xs text-fg-muted">
        Current: assay {humanize(assayState)}
        {learningState ? `; learning ${humanize(learningState)}` : "; learning not started"}
      </p>
    </div>
  );
}
