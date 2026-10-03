import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import type { AgentQuery } from "@/lib/demo/types";
import { SimulatedLabel } from "../../_components/simulated-label";
import { AgentJobs } from "./agent-jobs";
import { AgentSteps } from "./agent-steps";
import { BudgetHold } from "./budget-hold";
import { HypothesisList } from "./hypothesis-list";
import { RetrievalScope } from "./retrieval-scope";
import { WorkPackageProposal } from "./work-package-proposal";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Presentational view of one agent query: there is deliberately no approve/accept control. */
export function AgentView({ query, retried }: { query: AgentQuery; retried: boolean }) {
  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-2">
        <SimulatedLabel label={query.label} />
        <Badge
          data-testid="agent-status"
          data-status={query.status}
          role="status"
          aria-label="Agent status"
        >
          {query.status}
        </Badge>
        <span className="text-sm text-fg-muted">{query.objective}</span>
      </p>
      <p role="note" className="text-sm">
        Agents recommend; scientists decide (ENT-05)
      </p>
      {query.status === "held" ? <BudgetHold query={query} /> : null}
      <Panel title="Steps">
        <AgentSteps steps={query.steps} />
      </Panel>
      <Panel title="Simulated jobs">
        <AgentJobs query={query} retried={retried} />
      </Panel>
      <Panel title="Retrieval scope">
        <RetrievalScope scope={query.retrieval_scope} />
      </Panel>
      <Panel title="Hypotheses">
        <HypothesisList hypotheses={query.hypotheses} />
      </Panel>
      {query.work_package_proposal ? (
        <Panel title="Proposed work package">
          <WorkPackageProposal queryId={query.id} proposal={query.work_package_proposal} />
        </Panel>
      ) : null}
    </div>
  );
}
