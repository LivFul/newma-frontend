import type { Metadata } from "next";
import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type { CampaignSummary, CharterOut, CreditUsage, Items } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { WorkflowHeader } from "../_components/workflow-header";
import { CharterPanel } from "./_components/charter-panel";
import { JobProbe } from "./_components/job-probe";
import { ProtocolNote } from "./_components/protocol-note";
import { QuotaForm } from "./_components/quota-form";
import { QuotaPanel } from "./_components/quota-panel";
import { ThresholdForm } from "./_components/threshold-form";
import { VersionHistory } from "./_components/version-history";

export const metadata: Metadata = { title: "Campaign, quotas & cost — NEWMA demo" };

// Reads are no-store (demoFetch) and the layout is force-dynamic: router.refresh() after a write
// re-reads the charter, the version history and the usage meter (Review Focus 3).
export default async function CampaignPage() {
  const [session, campaigns] = await Promise.all([
    requireSession(),
    load<Items<CampaignSummary>>("/v1/campaigns"),
  ]);
  const campaign = campaigns.data?.items[0];
  const [charter, usage] = campaign
    ? await Promise.all([
        load<CharterOut>(`/v1/campaigns/${encodeURIComponent(campaign.id)}/charter`),
        load<CreditUsage>(`/v1/campaigns/${encodeURIComponent(campaign.id)}/credit-usage`),
      ])
    : [undefined, undefined];
  return (
    <>
      <WorkflowHeader id="W9" title="Campaign, quotas & cost">
        The campaign charter holds the scientific thresholds as numbered protocol versions, and a
        credit quota in demo credits limits what simulated jobs may reserve.
      </WorkflowHeader>
      <ErrorNotice error={campaigns.error} />
      <ErrorNotice error={charter?.error} />
      <ErrorNotice error={usage?.error} />
      {!campaign && !campaigns.error ? (
        <p className="text-sm text-fg-muted">No campaign was found for this tenant.</p>
      ) : null}
      {campaign && charter?.data ? (
        <>
          <CharterPanel charter={charter.data} />
          <ProtocolNote />
          <VersionHistory versions={charter.data.versions} />
          <ThresholdForm charter={charter.data} allowed={canAct(session.persona, "edit_charter")} />
        </>
      ) : null}
      {campaign && usage?.data ? (
        <>
          <QuotaPanel usage={usage.data} />
          <QuotaForm
            campaignId={campaign.id}
            current={usage.data.credit_quota}
            allowed={canAct(session.persona, "edit_quota")}
          />
        </>
      ) : null}
      <JobProbe />
    </>
  );
}
