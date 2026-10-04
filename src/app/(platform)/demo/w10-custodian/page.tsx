import type { Metadata } from "next";
import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type { CustodianView } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { WorkflowHeader } from "../_components/workflow-header";
import { AgreementCard } from "./_components/agreement-card";
import { OutcomeNotice } from "./_components/outcome-notice";
import { Summary } from "./_components/summary";

export const metadata: Metadata = { title: "Custodian view — NEWMA demo" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Server-rendered, no client components in the tree (A-P5B-16): the forms are plain HTML posts.
// Each render mints a fresh key per agreement, so a double submit replays at the backend.
export default async function CustodianPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const allowed = canAct(session.persona, "view_custodian");
  const view = allowed ? await load<CustodianView>("/v1/custodian/view") : undefined;
  const raised = first(params.raised);
  const refusedFor = first(params.error) === "validation_error" ? first(params.for) : undefined;
  // A hand-typed ?raised= must not read as a success: the id has to be a listed concern.
  const raisedKnown =
    raised === "1" ||
    (view?.data?.agreements ?? []).some((a) => a.grievances.some((g) => g.id === raised));
  return (
    <>
      <WorkflowHeader id="W10" title="Custodian view">
        Plain-language agreements about community knowledge: what is allowed, what was promised, and
        a way to raise a concern.
      </WorkflowHeader>
      {allowed ? null : (
        <PersonaForbiddenNotice allowed={["community_liaison", "data_steward", "tenant_admin"]} />
      )}
      <OutcomeNotice raised={raised} error={first(params.error)} raisedKnown={raisedKnown} />
      <ErrorNotice error={view?.error} />
      {view?.data ? (
        <>
          <Summary summary={view.data.summary} />
          {view.data.agreements.map((agreement) => (
            <AgreementCard
              key={agreement.rights_record_id}
              agreement={agreement}
              idempotencyKey={crypto.randomUUID()}
              refused={refusedFor === agreement.rights_record_id}
            />
          ))}
        </>
      ) : null}
    </>
  );
}
