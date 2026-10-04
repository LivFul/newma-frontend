import { SimulatedLabel } from "../../_components/simulated-label";

/** Overview explainer: anchoring is optional, simulated and never gates settlement. */
export function AnchorNotice() {
  return (
    <p role="note" className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
      Anchoring a signed settlement commitment is optional and simulated. It runs as a job on the
      <SimulatedLabel label="Simulated workflow engine" />
      and never blocks a settlement or any other workflow.
    </p>
  );
}
