import Link from "next/link";
import { Badge, SyntheticBadge } from "@/components/ui";
import { formatCredits } from "@/lib/credits";
import type { SettlementSummary } from "@/lib/demo/types";
import { W7StateBadge } from "./state-badge";

export function SettlementList({ settlements }: { settlements: readonly SettlementSummary[] }) {
  if (settlements.length === 0) return <p className="text-sm text-fg-muted">No settlements yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {settlements.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
          <Link
            href={`/demo/w7-settlement/settlements/${encodeURIComponent(s.id)}`}
            className="font-medium underline underline-offset-4"
          >
            {s.display_id}
          </Link>
          <W7StateBadge vocabulary="settlement" value={s.state} />
          {s.seeded_example ? (
            <>
              <Badge>Seeded example</Badge>
              <SyntheticBadge />
            </>
          ) : null}
          <span className="text-sm">{formatCredits(s.recorded_demo_credits)}</span>
          {s.held_demo_credits > 0 ? (
            <span className="text-sm text-fg-muted">{formatCredits(s.held_demo_credits)} held</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
