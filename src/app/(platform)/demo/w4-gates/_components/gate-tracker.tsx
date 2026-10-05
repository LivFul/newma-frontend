import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui";
import { Mark } from "@/components/ui/mark";
import { GATE_STAGES, type Gate, type GateStage } from "@/lib/demo/types";
import { GateChecks } from "./gate-checks";
import { MissingRequirements } from "./missing-requirements";

const OUT_OF_SCOPE: ReadonlySet<GateStage> = new Set(["L2", "D"]);

type Props = Readonly<{ gates: readonly Gate[]; renderAction: (gate: Gate) => ReactNode }>;

type Marker = "passed" | "held" | "failed" | "open" | "out";

function markerFor(gate: Gate | undefined, outOfScope: boolean): Marker {
  if (outOfScope || !gate) return "out";
  if (gate.status === "PASS") return "passed";
  if (gate.status === "HOLD" || gate.status === "PENDING") return "held";
  if (gate.status === "FAIL" || gate.status === "INVALIDATED") return "failed";
  return "open";
}

const MARKER_CLASS: Readonly<Record<Marker, string>> = {
  passed: "border-success-ink bg-success",
  held: "hatch-held border-warning-ink bg-bg-elevated",
  failed: "border-danger bg-danger",
  open: "border-fg bg-bg",
  out: "border-dashed border-fg-muted bg-bg",
};

// The benchmark on the route: a surveyed, fixed point. Shape and fill follow the gate status; the
// status badge beside it says the same in words.
function Benchmark({ marker }: { marker: Marker }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0.5 left-0 grid size-7 place-items-center rounded-full border-[1.5px] ${MARKER_CLASS[marker]}`}
    >
      {marker === "passed" ? <Mark kind="check" /> : null}
      {marker === "failed" ? <Mark kind="cross" className="size-3.5 text-danger-fg" /> : null}
    </span>
  );
}

// The route segment from this benchmark down to the next: the apricot band while gates keep
// passing, a dashed ink line once the route is not yet surveyed.
function Segment({ walked, last }: { walked: boolean; last: boolean }) {
  if (last) return null;
  return (
    <span
      aria-hidden="true"
      className={
        walked
          ? "absolute top-8 bottom-0 left-[0.6875rem] w-[6px] border-x-[1.5px] border-route-edge bg-route"
          : "absolute top-8 bottom-0 left-[0.8125rem] w-0 border-l-[1.5px] border-dashed border-fg-muted"
      }
    />
  );
}

/** RM §2.6 stages in order along a vertical route; L2 and D are shown greyed (A-P3-06). */
export function GateTracker({ gates, renderAction }: Props) {
  const byStage = new Map(gates.map((gate) => [gate.stage, gate]));
  return (
    <ol aria-label="Gate tracker">
      {GATE_STAGES.map((stage, index) => {
        const gate = byStage.get(stage);
        const outOfScope = OUT_OF_SCOPE.has(stage);
        const marker = markerFor(gate, outOfScope);
        const last = index === GATE_STAGES.length - 1;
        if (outOfScope || !gate) {
          return (
            <li key={stage} className="relative pb-6 pl-12 text-fg-muted">
              <Benchmark marker={marker} />
              <Segment walked={false} last={last} />
              <span className="font-mono">{stage}</span> ·{" "}
              <span>{outOfScope ? "not in demo scope" : "no gate record"}</span>
            </li>
          );
        }
        return (
          <li
            key={stage}
            className="relative space-y-3 pb-10 pl-12"
            data-stage={stage}
            data-gate-id={gate.id}
            data-status={gate.status}
          >
            <Benchmark marker={marker} />
            <Segment walked={marker === "passed"} last={last} />
            <p className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-semibold">{stage}</span>
              <StatusBadge status={gate.status} />
              {gate.evidence_package_version ? (
                <span className="gridref text-fg-muted">
                  evidence package v{gate.evidence_package_version}
                </span>
              ) : null}
            </p>
            <GateChecks checks={gate.checks} pending={gate.status === "NOT_STARTED"} />
            <MissingRequirements items={gate.missing_requirements} />
            {renderAction(gate)}
          </li>
        );
      })}
    </ol>
  );
}
