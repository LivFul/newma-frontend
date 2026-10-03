import Link from "next/link";
import { notFound } from "next/navigation";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { EventManifest } from "@/lib/demo/types";
import { ErrorNotice } from "../../../_components/error-notice";
import { SimulatedLabel } from "../../../_components/simulated-label";
import { WorkflowHeader } from "../../../_components/workflow-header";
import { ManifestWorkbench } from "../../_components/manifest-workbench";

type Params = Promise<{ eventId: string }>;

/**
 * One signed event by id: settlement and license timelines are not in the P3 EntityType enum
 * (A-P5A-10), so W7 links here to inspect, tamper-test and verify a single manifest.
 */
export default async function EventProvenancePage({ params }: { params: Params }) {
  const { eventId } = await params;
  if (!isSafeId(eventId)) notFound();
  const manifest = await load<EventManifest>(`/v1/provenance/events/${eventId}/manifest`);
  return (
    <>
      <WorkflowHeader
        id="W6"
        title="Provenance: signed event"
        labels={<SimulatedLabel label="Demo signature, not production key" />}
      >
        <span className="font-mono text-xs">{eventId}</span> ·{" "}
        <Link href="/demo/w6-provenance" className="underline underline-offset-4">
          All entities
        </Link>
      </WorkflowHeader>
      <section aria-labelledby="manifest-heading" className="space-y-3">
        <h2 id="manifest-heading" className="text-xl font-semibold">
          Event manifest
        </h2>
        <ErrorNotice error={manifest.error} />
        {manifest.data ? <ManifestWorkbench key={eventId} manifest={manifest.data} /> : null}
      </section>
    </>
  );
}
