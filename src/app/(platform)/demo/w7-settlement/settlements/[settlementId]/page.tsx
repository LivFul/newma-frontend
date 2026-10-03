import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/demo/current-session";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { EntityEvents, Settlement } from "@/lib/demo/types";
import { ErrorNotice } from "../../../_components/error-notice";
import { SimulatedLabel } from "../../../_components/simulated-label";
import { WorkflowHeader } from "../../../_components/workflow-header";
import { EventList } from "../../_components/event-list";
import { SettlementWorkspace } from "../../_components/settlement-workspace";

type Params = Promise<{ settlementId: string }>;

const SEEDED_EVENTS = "No signed events: seeded example";

export default async function SettlementPage({ params }: { params: Params }) {
  const [{ settlementId }, session] = await Promise.all([params, requireSession()]);
  if (!isSafeId(settlementId)) notFound();
  const [settlement, events] = await Promise.all([
    load<Settlement>(`/v1/settlements/${settlementId}`),
    load<EntityEvents>(`/v1/settlements/${settlementId}/events`),
  ]);
  const data = settlement.data;
  // The seeded example has no signed events; the backend answers 404 (A-P5A-F04).
  const seededWithoutEvents = data?.seeded_example === true && events.error?.code === "not_found";
  return (
    <>
      <WorkflowHeader
        id="W7"
        title={data ? `Settlement ${data.display_id}` : "Settlement"}
        labels={
          <>
            <SimulatedLabel label="Optional, simulated" />
            <SimulatedLabel label="Demo signature, not production key" />
          </>
        }
      >
        <Link href="/demo/w7-settlement" className="underline underline-offset-4">
          All licenses and settlements
        </Link>
      </WorkflowHeader>
      <ErrorNotice error={settlement.error} />
      {data ? <SettlementWorkspace settlement={data} persona={session.persona} /> : null}
      <section aria-labelledby="events-heading" className="space-y-3">
        <h2 id="events-heading" className="text-xl font-semibold">
          Signed events
        </h2>
        {seededWithoutEvents ? null : <ErrorNotice error={events.error} />}
        <EventList
          events={events.data?.events ?? []}
          emptyText={seededWithoutEvents ? SEEDED_EVENTS : undefined}
        />
      </section>
    </>
  );
}
