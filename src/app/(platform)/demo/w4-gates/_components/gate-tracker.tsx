import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui";
import { GATE_STAGES, type Gate, type GateStage } from "@/lib/demo/types";
import { GateChecks } from "./gate-checks";
import { MissingRequirements } from "./missing-requirements";

const OUT_OF_SCOPE: ReadonlySet<GateStage> = new Set(["L2", "D"]);

type Props = Readonly<{ gates: readonly Gate[]; renderAction: (gate: Gate) => ReactNode }>;

/** RM §2.6 stages in order; L2 and D are shown greyed (A-P3-06). */
export function GateTracker({ gates, renderAction }: Props) {
  const byStage = new Map(gates.map((gate) => [gate.stage, gate]));
  return (
    <ol aria-label="Gate tracker" className="space-y-3">
      {GATE_STAGES.map((stage) => {
        const gate = byStage.get(stage);
        if (OUT_OF_SCOPE.has(stage) || !gate) {
          return (
            <li key={stage} className="rounded-md border border-border p-3 text-fg-muted">
              <span className="font-mono">{stage}</span> ·{" "}
              <span>{OUT_OF_SCOPE.has(stage) ? "not in demo scope" : "no gate record"}</span>
            </li>
          );
        }
        return (
          <li
            key={stage}
            className="space-y-2 rounded-md border border-border p-3"
            data-stage={stage}
            data-gate-id={gate.id}
            data-status={gate.status}
          >
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{stage}</span>
              <StatusBadge status={gate.status} />
              {gate.evidence_package_version ? (
                <span className="text-sm text-fg-muted">
                  evidence package v{gate.evidence_package_version}
                </span>
              ) : null}
            </p>
            <GateChecks checks={gate.checks} />
            <MissingRequirements items={gate.missing_requirements} />
            {renderAction(gate)}
          </li>
        );
      })}
    </ol>
  );
}
