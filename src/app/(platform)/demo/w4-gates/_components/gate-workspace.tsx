"use client";
import { useState } from "react";
import type { EvidencePackage, Gate, GateDecision } from "@/lib/demo/types";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { GateTracker } from "./gate-tracker";
import { SignDecisionDialog } from "./sign-decision-dialog";
import { SIGNED_DECISION_ID, SignedDecisionCard } from "./signed-decision-card";

type Props = Readonly<{
  gates: readonly Gate[];
  packages: readonly EvidencePackage[];
  candidateDisplayId: string;
  allowed: boolean;
}>;

const DECIDABLE: ReadonlySet<Gate["status"]> = new Set(["NOT_STARTED", "PENDING", "HOLD", "FAIL"]);
const IN_SCOPE: ReadonlySet<Gate["stage"]> = new Set(["H0", "H1", "H2", "H3", "L1"]);

function versionsFor(gate: Gate, packages: readonly EvidencePackage[]): readonly number[] {
  const own = packages.filter((p) => p.stage === gate.stage).map((p) => p.version);
  const any = packages.map((p) => p.version);
  const versions = own.length ? own : any.length ? any : [gate.evidence_package_version ?? 1];
  return [...new Set(versions)].sort((a, b) => a - b);
}

type Signed = Readonly<{ decision: GateDecision; replayed: boolean }>;

export function GateWorkspace({ gates, packages, candidateDisplayId, allowed }: Props) {
  const [signed, setSigned] = useState<Signed | undefined>();
  const renderAction = (gate: Gate) =>
    IN_SCOPE.has(gate.stage) && DECIDABLE.has(gate.status) ? (
      <SignDecisionDialog
        gate={gate}
        candidateDisplayId={candidateDisplayId}
        versions={versionsFor(gate, packages)}
        allowed={allowed}
        onSigned={(decision, replayed) => {
          setSigned({ decision, replayed });
          // The trigger unmounts once the gate is decided: move focus to the result.
          requestAnimationFrame(() => document.getElementById(SIGNED_DECISION_ID)?.focus());
        }}
      />
    ) : null;
  return (
    <div className="space-y-4">
      {allowed ? null : <PersonaForbiddenNotice allowed={["scientific_approver"]} />}
      <div role="status" aria-live="polite">
        {signed ? (
          <SignedDecisionCard decision={signed.decision} replayed={signed.replayed} />
        ) : null}
      </div>
      <GateTracker gates={gates} renderAction={renderAction} />
    </div>
  );
}
