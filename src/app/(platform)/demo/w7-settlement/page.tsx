import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type {
  Beneficiary,
  BenefitItem,
  Items,
  OutageState,
  License,
  LicenseOptions,
  SettlementSummary,
} from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";
import { AnchorNotice } from "./_components/anchor-notice";
import { BeneficiaryView } from "./_components/beneficiary-view";
import { BenefitTracker } from "./_components/benefit-tracker";
import { LicenseList } from "./_components/license-list";
import { LicenseRequestForm } from "./_components/license-request-form";
import { OutageToggle } from "./_components/outage-toggle";
import { SettlementList } from "./_components/settlement-list";

export default async function SettlementOverviewPage() {
  const session = await requireSession();
  const [options, licenses, settlements, outage, benefits, beneficiaries] = await Promise.all([
    load<LicenseOptions>("/v1/licenses/options"),
    load<Items<License>>("/v1/licenses"),
    load<Items<SettlementSummary>>("/v1/settlements"),
    load<OutageState>("/v1/demo/anchoring/outage"),
    load<Items<BenefitItem>>("/v1/benefits"),
    load<Items<Beneficiary>>("/v1/beneficiaries"),
  ]);
  const allowed = canAct(session.persona, "request_license");
  return (
    <>
      <WorkflowHeader
        id="W7"
        title="Licensing & benefit settlement"
        labels={
          <>
            <SimulatedLabel label="Optional, simulated" />
            <SimulatedLabel label="Demo signature, not production key" />
          </>
        }
      >
        A partner requests a license; a tenant admin decides it; finance settles receipts into an
        illustrative split in demo credits, two different approvers authorise it, and a signed
        commitment can be verified in W6.
      </WorkflowHeader>
      {[options, licenses, settlements, outage, benefits, beneficiaries].map((read, index) => (
        <ErrorNotice key={index} error={read.error} />
      ))}
      <section aria-labelledby="request-heading" className="space-y-3">
        <h2 id="request-heading" className="text-xl font-semibold">
          Request a license
        </h2>
        {allowed ? null : <PersonaForbiddenNotice allowed={["partner"]} />}
        {allowed && options.data ? (
          <LicenseRequestForm options={options.data} allowed={allowed} />
        ) : null}
      </section>
      <section aria-labelledby="licenses-heading" className="space-y-3">
        <h2 id="licenses-heading" className="text-xl font-semibold">
          Licenses
        </h2>
        <LicenseList licenses={licenses.data?.items ?? []} />
      </section>
      <section aria-labelledby="settlements-heading" className="space-y-3">
        <h2 id="settlements-heading" className="text-xl font-semibold">
          Settlements
        </h2>
        <SettlementList settlements={settlements.data?.items ?? []} />
      </section>
      <section aria-labelledby="benefits-heading" className="space-y-3">
        <h2 id="benefits-heading" className="text-xl font-semibold">
          Non-monetary benefits
        </h2>
        <BenefitTracker items={benefits.data?.items ?? []} persona={session.persona} />
      </section>
      <section aria-labelledby="beneficiaries-heading" className="space-y-3">
        <h2 id="beneficiaries-heading" className="text-xl font-semibold">
          Beneficiaries
        </h2>
        <BeneficiaryView beneficiaries={beneficiaries.data?.items ?? []} />
      </section>
      <section aria-labelledby="anchoring-heading" className="space-y-3">
        <h2 id="anchoring-heading" className="text-xl font-semibold">
          Anchoring
        </h2>
        <AnchorNotice />
        {outage.data ? (
          <OutageToggle initial={outage.data} />
        ) : (
          <p className="text-sm text-fg-muted">Outage state unknown: the read failed.</p>
        )}
      </section>
    </>
  );
}
