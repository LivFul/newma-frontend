import { load } from "@/lib/demo/server-data";
import type { Compound, Observation, Page, Taxon } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { CursorPager } from "./cursor-pager";
import { CompoundsTable, ObservationsTable, TaxaTable } from "./evidence-table";

type Tab = "taxa" | "compounds" | "observations";

const PATHS = {
  taxa: "/v1/taxa",
  compounds: "/v1/compounds",
  observations: "/v1/observations",
} as const;

export async function EvidenceTab({ tab, cursor }: { tab: Tab; cursor: string | undefined }) {
  const page = await load<Page<Taxon | Compound | Observation>>(PATHS[tab], { query: { cursor } });
  const items = page.data?.items ?? [];
  return (
    <div className="space-y-3">
      <ErrorNotice error={page.error} />
      {tab === "taxa" ? <TaxaTable items={items as readonly Taxon[]} /> : null}
      {tab === "compounds" ? <CompoundsTable items={items as readonly Compound[]} /> : null}
      {tab === "observations" ? (
        <ObservationsTable items={items as readonly Observation[]} />
      ) : null}
      <CursorPager tab={tab} cursor={cursor} nextCursor={page.data?.next_cursor ?? null} />
    </div>
  );
}
