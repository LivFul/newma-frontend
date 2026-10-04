import { humanize } from "../../_components/fields";
import type { SettlementState } from "@/lib/demo/types";

// The WP §3.6 machine in order; `disputed` and `paused` are side states (A-P5A-02).
const MACHINE = [
  "submitted",
  "reviewed",
  "approved",
  "receipts_reconciled",
  "distribution_authorized",
  "funded",
  "paid",
  "audited",
] as const satisfies readonly SettlementState[];
const SIDE = ["disputed", "paused"] as const satisfies readonly SettlementState[];

const ITEM =
  "rounded-md border border-border px-3 py-1 text-sm aria-[current=step]:border-accent aria-[current=step]:font-semibold data-[done=true]:bg-bg-elevated";

/** Where the settlement is on the machine; the current state is aria-current="step". */
export function StateStepper({ state }: { state: SettlementState }) {
  const index = (MACHINE as readonly string[]).indexOf(state);
  return (
    <div role="group" aria-label="Settlement progress" className="space-y-2">
      <ol aria-label="Settlement states" className="flex flex-wrap gap-2">
        {MACHINE.map((step, i) => (
          <li
            key={step}
            data-state={step}
            data-done={i < index ? "true" : undefined}
            aria-current={step === state ? "step" : undefined}
            className={ITEM}
          >
            {i < index ? <span aria-hidden="true">✓ </span> : null}
            <span>{humanize(step)}</span>
            {i < index ? <span className="sr-only"> (completed)</span> : null}
            {step === state ? <span className="sr-only"> (current state)</span> : null}
          </li>
        ))}
      </ol>
      <ol aria-label="Side states" className="flex flex-wrap gap-2">
        {SIDE.map((step) => (
          <li
            key={step}
            data-state={step}
            aria-current={step === state ? "step" : undefined}
            className={`${ITEM} border-dashed`}
          >
            <span>{humanize(step)}</span>
            {step === state ? <span className="sr-only"> (current state)</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
