import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { Items, Reconciliation, RetrainingProposal, WorkPackage } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../../_components/simulated-label";
import { WorkflowHeader } from "../../_components/workflow-header";
import { ReconciliationTable } from "../_components/reconciliation-table";
import { RetrainingProposalCard } from "../_components/retraining-proposal";
import { WorkPackageLive } from "../_components/work-package-live";

type Params = Promise<{ workPackageId: string }>;

export default async function WorkPackagePage({ params }: { params: Params }) {
  const [{ workPackageId }, session] = await Promise.all([params, requireSession()]);
  if (!isSafeId(workPackageId)) notFound();
  const canView = canAct(session.persona, "view_reconciliation");
  const [wp, reconciliation, proposals] = await Promise.all([
    load<WorkPackage>(`/v1/work-packages/${workPackageId}`),
    canView
      ? load<Reconciliation>("/v1/reconciliation", { query: { work_package_id: workPackageId } })
      : Promise.resolve(undefined),
    load<Items<RetrainingProposal>>("/v1/retraining-proposals"),
  ]);
  const ownProposals = (proposals.data?.items ?? []).filter(
    (p) => p.status === "blocked_pending_authorization",
  );
  return (
    <>
      <WorkflowHeader
        id="W5"
        title="Work package"
        labels={
          <>
            <SimulatedLabel label="Mock ELN" />
            <SimulatedLabel label="Simulated workflow engine" />
          </>
        }
      >
        <span className="font-mono text-xs">{workPackageId}</span> ·{" "}
        <Link href="/demo/w5-wet-lab" className="underline underline-offset-4">
          New work package
        </Link>
      </WorkflowHeader>
      <ErrorNotice error={wp.error} />
      {wp.data ? (
        <section aria-labelledby="loop-heading" className="space-y-3">
          <h2 id="loop-heading" className="text-xl font-semibold">
            Loop
          </h2>
          <WorkPackageLive key={wp.data.id} initial={wp.data} persona={session.persona} />
        </section>
      ) : null}
      <section aria-labelledby="recon-heading" className="space-y-3">
        <h2 id="recon-heading" className="text-xl font-semibold">
          Sample reconciliation
        </h2>
        {canView ? null : (
          <PersonaForbiddenNotice allowed={["scientist", "wet_lab_cro", "data_steward"]} />
        )}
        <ErrorNotice error={reconciliation?.error} />
        {reconciliation?.data ? (
          <ReconciliationTable
            reconciliation={reconciliation.data}
            canDispose={canAct(session.persona, "record_disposition")}
          />
        ) : null}
      </section>
      <section aria-labelledby="retraining-heading" className="space-y-3">
        <h2 id="retraining-heading" className="text-xl font-semibold">
          Model retraining
        </h2>
        <ErrorNotice error={proposals.error} />
        {ownProposals.length === 0 ? (
          <p className="text-sm text-fg-muted">No retraining proposals yet.</p>
        ) : null}
        {ownProposals.map((proposal) => (
          <RetrainingProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </section>
    </>
  );
}
