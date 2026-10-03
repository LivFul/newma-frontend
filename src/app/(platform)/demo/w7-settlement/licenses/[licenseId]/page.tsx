import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { BenefitItem, EntityEvents, Items, License } from "@/lib/demo/types";
import { ErrorNotice } from "../../../_components/error-notice";
import { PersonaForbiddenNotice } from "../../../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../../../_components/simulated-label";
import { WorkflowHeader } from "../../../_components/workflow-header";
import { BenefitTracker } from "../../_components/benefit-tracker";
import { CreateSettlementButton } from "../../_components/create-settlement-button";
import { CredentialPanel } from "../../_components/credential-panel";
import { DecisionDialog } from "../../_components/decision-dialog";
import { EventList } from "../../_components/event-list";
import { LicenseSummary } from "../../_components/license-summary";

type Params = Promise<{ licenseId: string }>;

export default async function LicensePage({ params }: { params: Params }) {
  const [{ licenseId }, session] = await Promise.all([params, requireSession()]);
  if (!isSafeId(licenseId)) notFound();
  const [license, events, benefits] = await Promise.all([
    load<License>(`/v1/licenses/${licenseId}`),
    load<EntityEvents>(`/v1/licenses/${licenseId}/events`),
    load<Items<BenefitItem>>("/v1/benefits", { query: { license_id: licenseId } }),
  ]);
  const data = license.data;
  const canCheck = canAct(session.persona, "check_credential");
  const canDecide = canAct(session.persona, "decide_license");
  const canSettle = canAct(session.persona, "create_settlement");
  return (
    <>
      <WorkflowHeader
        id="W7"
        title={data ? `License ${data.display_id}` : "License"}
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
      <ErrorNotice error={license.error} />
      {data ? (
        <>
          <LicenseSummary license={data} />
          <CredentialPanel license={data} allowed={canCheck} />
          <section aria-labelledby="decision-heading" className="space-y-3">
            <h2 id="decision-heading" className="text-xl font-semibold">
              Decision
            </h2>
            <DecisionDialog license={data} allowed={canDecide} />
          </section>
          {data.status === "approved" ? (
            <section aria-labelledby="settlement-heading" className="space-y-3">
              <h2 id="settlement-heading" className="text-xl font-semibold">
                Settlement
              </h2>
              {canSettle ? (
                <CreateSettlementButton licenseId={data.id} />
              ) : (
                <PersonaForbiddenNotice allowed={["finance"]} />
              )}
            </section>
          ) : null}
        </>
      ) : null}
      <section aria-labelledby="benefits-heading" className="space-y-3">
        <h2 id="benefits-heading" className="text-xl font-semibold">
          Non-monetary benefits
        </h2>
        <ErrorNotice error={benefits.error} />
        <BenefitTracker items={benefits.data?.items ?? []} persona={session.persona} />
      </section>
      <section aria-labelledby="events-heading" className="space-y-3">
        <h2 id="events-heading" className="text-xl font-semibold">
          Signed events
        </h2>
        <ErrorNotice error={events.error} />
        <EventList events={events.data?.events ?? []} />
      </section>
    </>
  );
}
