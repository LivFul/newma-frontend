import Link from "next/link";
import { notFound } from "next/navigation";
import { isEntityType } from "@/lib/demo/parse-provenance";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { EventManifest, ProvenanceTimeline } from "@/lib/demo/types";
import { ErrorNotice } from "../../../_components/error-notice";
import { humanize } from "../../../_components/fields";
import { SimulatedLabel } from "../../../_components/simulated-label";
import { WorkflowHeader } from "../../../_components/workflow-header";
import { EventTimeline } from "../../_components/event-timeline";
import { ManifestWorkbench } from "../../_components/manifest-workbench";

type Params = Promise<{ entityType: string; entityId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EntityProvenancePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ entityType, entityId }, query] = await Promise.all([params, searchParams]);
  if (!isEntityType(entityType) || !isSafeId(entityId)) notFound();
  const timeline = await load<ProvenanceTimeline>(`/v1/provenance/${entityType}/${entityId}`);
  const events = timeline.data?.events ?? [];
  const requested = Array.isArray(query.event) ? query.event[0] : query.event;
  const selected = events.find((e) => e.id === requested) ?? events.at(-1);
  const manifest = selected
    ? await load<EventManifest>(`/v1/provenance/events/${selected.id}/manifest`)
    : undefined;
  return (
    <>
      <WorkflowHeader
        id="W6"
        title={`Provenance: ${humanize(entityType)}`}
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        <span className="font-mono text-xs">{entityId}</span> ·{" "}
        <Link href="/demo/w6-provenance" className="underline underline-offset-4">
          All entities
        </Link>
      </WorkflowHeader>
      <section aria-labelledby="timeline-heading" className="space-y-3">
        <h2 id="timeline-heading" className="text-xl font-semibold">
          Append-only timeline
        </h2>
        <ErrorNotice error={timeline.error} />
        <EventTimeline
          events={events}
          entityType={entityType}
          entityId={entityId}
          selected={selected?.id}
        />
      </section>
      {selected ? (
        <section aria-labelledby="manifest-heading" className="space-y-3">
          <h2 id="manifest-heading" className="text-xl font-semibold">
            Event #{selected.seq}: {selected.event_type}
          </h2>
          <ErrorNotice error={manifest?.error} />
          {manifest?.data ? <ManifestWorkbench key={selected.id} manifest={manifest.data} /> : null}
        </section>
      ) : null}
    </>
  );
}
