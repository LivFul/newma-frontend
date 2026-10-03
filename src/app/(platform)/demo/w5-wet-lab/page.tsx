import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { isSafeId } from "@/lib/demo/safe-id";
import { load } from "@/lib/demo/server-data";
import type { AgentQuery, Candidate, Items, MaterialBatch } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";
import { WorkPackageForm } from "./_components/work-package-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WetLabPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const [candidates, batches, agent] = await Promise.all([
    load<Items<Candidate>>("/v1/candidates"),
    load<Items<MaterialBatch>>("/v1/material-batches"),
    from && isSafeId(from)
      ? load<AgentQuery>(`/v1/agent/queries/${from}`)
      : Promise.resolve(undefined),
  ]);
  const allowed = canAct(session.persona, "create_work_package");
  const proposal = agent?.data?.work_package_proposal ?? undefined;
  const sorted = [...(candidates.data?.items ?? [])].sort((a, b) => a.rank - b.rank);
  return (
    <>
      <WorkflowHeader
        id="W5"
        title="Closed-loop wet lab"
        labels={
          <>
            <SimulatedLabel label="Mock ELN" />
            <SimulatedLabel label="Simulated workflow engine" />
          </>
        }
      >
        A scientist turns a hypothesis into a work package; the simulated lab executes it, results
        are imported from the Mock ELN, reconciled and accepted before any gate or model sees them.
      </WorkflowHeader>
      <section aria-labelledby="create-heading" className="space-y-3">
        <h2 id="create-heading" className="text-xl font-semibold">
          New work package
        </h2>
        {proposal ? (
          <p role="note" className="text-sm">
            Prefilled from the simulated agent&apos;s proposal (W3). A scientist decides whether to
            submit it.
          </p>
        ) : null}
        {allowed ? null : <PersonaForbiddenNotice allowed={["scientist"]} />}
        <ErrorNotice error={candidates.error ?? batches.error ?? agent?.error} />
        <WorkPackageForm
          candidates={sorted}
          batches={batches.data?.items ?? []}
          proposal={proposal}
          allowed={allowed}
        />
      </section>
    </>
  );
}
