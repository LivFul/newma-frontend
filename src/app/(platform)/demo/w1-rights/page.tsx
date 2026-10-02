import { requireSession } from "@/lib/demo/current-session";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type { CacheEntry, Items, RightsRecord } from "@/lib/demo/types";
import { ErrorNotice } from "../_components/error-notice";
import { PersonaForbiddenNotice } from "../_components/persona-forbidden-notice";
import { WorkflowHeader } from "../_components/workflow-header";
import { CacheEntries } from "./_components/cache-entries";
import { PolicyEvaluator } from "./_components/policy-evaluator";
import { RightsTable } from "./_components/rights-table";

// Every read is no-store (demoFetch) and the layout is force-dynamic, so router.refresh() after a
// withdrawal re-reads the registry and the cache (Review Focus 1). The evaluator is keyed on the
// record statuses: a withdrawal remounts it and drops the earlier "allow".
const statusKey = (records: readonly RightsRecord[]) =>
  records.map((r) => `${r.id}:${r.status}`).join(",");

export default async function RightsPage() {
  const [session, records, cache] = await Promise.all([
    requireSession(),
    load<Items<RightsRecord>>("/v1/rights/records"),
    load<Items<CacheEntry>>("/v1/retrieval/cache"),
  ]);
  const items = records.data?.items ?? [];
  const canWithdraw = canAct(session.persona, "withdraw_rights");
  return (
    <>
      <WorkflowHeader id="W1" title="Rights & use authorization">
        Fictional rights and consent records decide every purpose-bound use. Decisions are allow,
        hold or deny, each with recorded reasons.
      </WorkflowHeader>
      <section aria-labelledby="registry-heading" className="space-y-3">
        <h2 id="registry-heading" className="text-xl font-semibold">
          Rights registry
        </h2>
        <ErrorNotice error={records.error} />
        {canWithdraw ? null : <PersonaForbiddenNotice allowed={["community_liaison"]} />}
        <RightsTable records={items} canWithdraw={canWithdraw} />
      </section>
      <section aria-labelledby="evaluate-heading" className="space-y-3">
        <h2 id="evaluate-heading" className="text-xl font-semibold">
          Policy evaluation
        </h2>
        <PolicyEvaluator
          key={statusKey(items)}
          records={items}
          tenantId={session.tenant_id}
          persona={session.persona}
        />
      </section>
      <section aria-labelledby="cache-heading" className="space-y-3">
        <h2 id="cache-heading" className="text-xl font-semibold">
          Retrieval cache
        </h2>
        <ErrorNotice error={cache.error} />
        <CacheEntries entries={cache.data?.items ?? []} />
      </section>
    </>
  );
}
