import type { WorkPackage } from "@/lib/demo/types";
import { SimulatedLabel } from "../../_components/simulated-label";

type Props = Readonly<{ eln: NonNullable<WorkPackage["eln"]>; accepted: boolean }>;

/** LAB-08: being recorded in the (mock) ELN is not the same as being accepted by a scientist. */
export function ElnRecordCard({ eln, accepted }: Props) {
  return (
    <div className="space-y-1 rounded-md border border-border p-3 text-sm">
      <p className="flex items-center gap-2">
        <SimulatedLabel label="Mock ELN" />
        <span className="font-mono">{eln.record_id}</span>
      </p>
      <p>Recorded in Mock ELN · revision {eln.revision}</p>
      <p className="text-fg-muted">
        {accepted ? "Accepted by NEWMA scientist" : "Not yet accepted by a NEWMA scientist"}
      </p>
    </div>
  );
}
