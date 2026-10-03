"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePolling } from "@/lib/demo/use-polling";
import type { WorkPackage } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { ErrorNotice } from "../../_components/error-notice";
import { humanize } from "../../_components/fields";
import { ElnRecordCard } from "./eln-record-card";
import { ExecutionProgress } from "./execution-progress";
import { LabWorkspace } from "./lab-workspace";
import { LoopDiagram } from "./loop-diagram";
import { MaterialGateResult } from "./material-gate-result";

// Poll while the simulated lab is working; the rest of the loop moves on explicit actions.
const RUNNING: ReadonlySet<WorkPackage["status"]> = new Set(["submitted", "executing"]);
const settled = (wp: WorkPackage) => !RUNNING.has(wp.status);

type Props = Readonly<{ initial: WorkPackage; persona: PersonaId }>;

export function WorkPackageLive({ initial, persona }: Props) {
  const router = useRouter();
  const { data, error, refetch } = usePolling<WorkPackage>(
    `/api/demo/work-packages/${encodeURIComponent(initial.id)}`,
    settled,
  );
  const wp = data ?? initial;
  // Server parts (reconciliation, proposals) re-read when the package status moves on.
  const [seenStatus, setSeenStatus] = useState(wp.status);
  if (seenStatus !== wp.status) {
    setSeenStatus(wp.status);
    router.refresh();
  }
  return (
    <div className="space-y-6">
      <p className="text-sm" data-testid="work-package-status" data-status={wp.status}>
        Status: <span className="font-semibold">{humanize(wp.status)}</span>
      </p>
      <ErrorNotice error={error} />
      <LoopDiagram assayState={wp.loop_state} learningState={wp.learning_loop_state} />
      <MaterialGateResult gate={wp.material_gate} />
      {wp.holds.length ? (
        <ul className="text-sm" aria-label="Holds">
          {wp.holds.map((hold, index) => (
            <li key={`${hold.code}:${index}`}>
              Hold <span className="font-mono">{hold.code}</span>
              {hold.disposition ? ` — ${humanize(hold.disposition)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {wp.eln ? <ElnRecordCard eln={wp.eln} accepted={wp.status === "accepted"} /> : null}
      {wp.job_id ? <ExecutionProgress jobId={wp.job_id} /> : null}
      <LabWorkspace
        workPackage={wp}
        candidateId={wp.candidate_id}
        persona={persona}
        onChanged={() => void refetch()}
      />
    </div>
  );
}
