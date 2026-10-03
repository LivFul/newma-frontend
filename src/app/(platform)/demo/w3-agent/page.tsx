import { requireSession } from "@/lib/demo/current-session";
import { isSafeId } from "@/lib/demo/safe-id";
import { canAct } from "@/lib/demo/persona-actions";
import { seededTargets } from "@/lib/demo/seed-targets";
import { load } from "@/lib/demo/server-data";
import type { AgentQuery } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../_components/simulated-label";
import { WorkflowHeader } from "../_components/workflow-header";
import { AgentConversation } from "./_components/agent-conversation";
import { AgentQueryForm } from "./_components/agent-query-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AgentPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const raw = Array.isArray(params.query) ? params.query[0] : params.query;
  const queryId = raw && isSafeId(raw) ? raw : undefined;
  const initial = queryId ? await load<AgentQuery>(`/v1/agent/queries/${queryId}`) : undefined;
  const allowed = canAct(session.persona, "run_agent_query");
  return (
    <>
      <WorkflowHeader
        id="W3"
        title="Agentic discovery"
        labels={<SimulatedLabel label="Simulated agent" />}
      >
        A scripted, deterministic agent (no LLM) plans a screening sequence within policy and
        budget. It recommends; a scientist decides.
      </WorkflowHeader>
      <section aria-labelledby="ask-heading" className="space-y-3">
        <h2 id="ask-heading" className="text-xl font-semibold">
          New query
        </h2>
        {allowed ? null : <PersonaForbiddenNotice allowed={["scientist"]} />}
        <AgentQueryForm targets={seededTargets(session.tenant_id)} allowed={allowed} />
      </section>
      {queryId ? (
        <section aria-labelledby="conversation-heading" className="space-y-3">
          <h2 id="conversation-heading" className="text-xl font-semibold">
            Agent conversation
          </h2>
          <ErrorNotice error={initial?.error} />
          <AgentConversation key={queryId} id={queryId} initial={initial?.data} />
        </section>
      ) : null}
    </>
  );
}
