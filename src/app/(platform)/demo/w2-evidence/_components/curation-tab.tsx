import type { PersonaId } from "@/lib/personas";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type { Claim, Items, SourceRecord } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { CurationQueue } from "./curation-queue";
import { IngestPanel } from "./ingest-panel";
import { ReleasePanel } from "./release-panel";
import { QUEUE_HEADING_ID } from "./claim-review-dialog";

// The backend bounds each unpaginated list at 500 items (ingestion/service.py LIST_LIMIT).
const QUEUE_CAP = 500;

/** Source record → extracted claims → steward review → curated release. */
export async function CurationTab({ persona }: { persona: PersonaId }) {
  // One status per request (contract): pending and quarantined claims are reviewable, approved
  // ones feed the release. Lists are unpaginated and bounded by the backend (A-P3-F07).
  const [sources, pending, quarantined, approved] = await Promise.all([
    load<Items<SourceRecord>>("/v1/curation/source-records"),
    load<Items<Claim>>("/v1/curation/queue", { query: { status: "pending_review" } }),
    load<Items<Claim>>("/v1/curation/queue", { query: { status: "quarantined" } }),
    load<Items<Claim>>("/v1/curation/queue", { query: { status: "approved" } }),
  ]);
  const allowed = canAct(persona, "decide_claim");
  const queue = [...(pending.data?.items ?? []), ...(quarantined.data?.items ?? [])];
  const approvedClaims = approved.data?.items ?? [];
  const capped = [
    [pending, "pending"],
    [quarantined, "quarantined"],
    [approved, "approved"],
  ] as const;
  const capNotices = capped
    .filter(([result]) => (result.data?.items.length ?? 0) >= QUEUE_CAP)
    .map(([, label]) => label);
  return (
    <div className="space-y-6">
      {capNotices.map((label) => (
        <p key={label} role="note" className="text-sm text-fg-muted">
          Showing the first {QUEUE_CAP} {label} claims (the list is capped).
        </p>
      ))}
      {allowed ? null : <PersonaForbiddenNotice allowed={["data_steward"]} />}
      <section aria-labelledby="sources-heading" className="space-y-2">
        <h3 id="sources-heading" className="text-lg font-semibold">
          Source records
        </h3>
        <ErrorNotice error={sources.error} />
        <IngestPanel sources={sources.data?.items ?? []} />
      </section>
      <section aria-labelledby="queue-heading" className="space-y-2">
        <h3 id={QUEUE_HEADING_ID} tabIndex={-1} className="text-lg font-semibold">
          Curation queue
        </h3>
        <ErrorNotice error={pending.error ?? quarantined.error} />
        <CurationQueue claims={queue} allowed={allowed} />
      </section>
      <section aria-labelledby="release-heading" className="space-y-2">
        <h3 id="release-heading" className="text-lg font-semibold">
          Curated release
        </h3>
        <ErrorNotice error={approved.error} />
        <ReleasePanel claims={approvedClaims} allowed={canAct(persona, "publish_release")} />
      </section>
    </div>
  );
}
