import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import type { CharterOut } from "@/lib/demo/types";
import { LockStateText } from "../../_components/status-text";

/** The lock state is stated in a sentence: never colour alone, never the bare enum. */
export function lockSentence(charter: Pick<CharterOut, "lock_state" | "bound_candidate_count">) {
  if (charter.lock_state === "open") return "Open: no candidates selected yet";
  const n = charter.bound_candidate_count;
  return `Locked: ${n} ${n === 1 ? "candidate was" : "candidates were"} selected under this protocol`;
}

export function CharterPanel({ charter }: { charter: CharterOut }) {
  const { thresholds } = charter;
  return (
    <section aria-labelledby="charter-heading" className="space-y-3">
      <h2 id="charter-heading" className="flex flex-wrap items-center gap-2 text-xl font-semibold">
        Campaign charter <SyntheticBadge />
      </h2>
      <p>
        {charter.name} · protocol version {charter.protocol_version}
      </p>
      <p data-testid="lock-badge" className="flex flex-wrap items-center gap-2">
        <LockStateText state={charter.lock_state} />
        <span>{lockSentence(charter)}</span>
      </p>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-fg-muted">Potency maximum (µM)</dt>
          <dd>{thresholds.potency_um_max}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Minimum replicates</dt>
          <dd>{thresholds.replicates_min}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Controls required</dt>
          <dd>{thresholds.controls_required ? "yes" : "no"}</dd>
        </div>
        {thresholds.note ? (
          <div className="sm:col-span-3">
            <dt className="text-fg-muted">Note</dt>
            <dd>{thresholds.note}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
