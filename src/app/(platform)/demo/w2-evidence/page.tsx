import { requireSession } from "@/lib/demo/current-session";
import { isCursor } from "@/lib/demo/parse-curation";
import { WorkflowHeader } from "../_components/workflow-header";
import { CurationTab } from "./_components/curation-tab";
import { EvidenceLegend } from "./_components/evidence-legend";
import { EvidenceTab } from "./_components/evidence-tab";
import { TabNav, W2_TABS, type W2Tab } from "./_components/tab-nav";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const asTab = (value: string | undefined): W2Tab =>
  W2_TABS.includes(value as W2Tab) ? (value as W2Tab) : "taxa";

export default async function EvidencePage({ searchParams }: { searchParams: SearchParams }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const tab = asTab(first(params.tab));
  // Same opaque-cursor check as the BFF route; an invalid one falls back to the first page.
  const rawCursor = first(params.cursor);
  const cursor = rawCursor && isCursor(rawCursor) ? rawCursor : undefined;
  return (
    <>
      <WorkflowHeader id="W2" title="Ingestion & curation">
        Synthetic taxa, compounds and observations with their evidence labels. Policy-withheld
        fields say so; nothing restricted is shown.
      </WorkflowHeader>
      <section aria-labelledby="legend-heading" className="space-y-2">
        <h2 id="legend-heading" className="text-xl font-semibold">
          Evidence labels
        </h2>
        <EvidenceLegend />
      </section>
      <TabNav active={tab} />
      <section aria-labelledby="tab-heading" className="space-y-3">
        <h2 id="tab-heading" className="text-xl font-semibold capitalize">
          {tab}
        </h2>
        {tab === "curation" ? (
          <CurationTab persona={session.persona} />
        ) : (
          <EvidenceTab tab={tab} cursor={cursor} />
        )}
      </section>
    </>
  );
}
