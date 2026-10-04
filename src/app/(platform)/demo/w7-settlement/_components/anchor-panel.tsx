import { Badge } from "@/components/ui";
import { W7_STATE_TONES } from "@/lib/demo/w7-status";
import type { Anchor, AnchorStatus } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { SimulatedLabel } from "../../_components/simulated-label";

const STATUS_LABEL: Readonly<Record<AnchorStatus, string>> = {
  not_requested: "Not requested",
  pending: "Pending",
  anchored: "Anchored",
};

const PENDING_TEXT =
  "The anchoring job is queued; during a simulated chain outage it stays pending and nothing else is blocked.";

function statusText(anchor: Anchor, audited: boolean): string {
  if (anchor.status === "pending") return PENDING_TEXT;
  if (anchor.status === "anchored") return "The commitment was anchored on the simulated chain.";
  return audited
    ? "No anchor was requested for this commitment."
    : "Anchoring is requested at final reconciliation; it is optional.";
}

/** Anchoring status (A-P5A-08): informational only, it never blocks or disables another control. */
export function AnchorPanel({ anchor, audited }: Readonly<{ anchor: Anchor; audited: boolean }>) {
  return (
    <div className="space-y-2 rounded-md border border-border p-4 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <SimulatedLabel label="Optional, simulated" />
        <SimulatedLabel label="Simulated workflow engine" />
      </p>
      <div data-testid="anchor-live" aria-live="polite" className="space-y-1">
        <p data-testid="anchor-status" className="flex flex-wrap items-center gap-2 font-medium">
          <Badge tone={W7_STATE_TONES.anchor[anchor.status]}>{STATUS_LABEL[anchor.status]}</Badge>
          {anchor.status === "not_requested" && !audited
            ? "(requested at final reconciliation)"
            : null}
        </p>
        <p>{statusText(anchor, audited)}</p>
        {anchor.job_state ? (
          <p>
            Job state: <span className="font-mono">{anchor.job_state}</span>
          </p>
        ) : null}
        {anchor.receipt_ref ? (
          <p>
            Receipt reference: <span className="font-mono">{anchor.receipt_ref}</span>
            {anchor.anchored_at ? ` · ${formatInstant(anchor.anchored_at)}` : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
