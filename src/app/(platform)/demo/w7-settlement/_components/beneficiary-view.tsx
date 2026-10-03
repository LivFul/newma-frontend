import Link from "next/link";
import { SyntheticBadge } from "@/components/ui";
import { formatCredits } from "@/lib/credits";
import type { Beneficiary } from "@/lib/demo/types";

/** The fictional beneficiaries and what their ledger entries add up to (demo credits only). */
export function BeneficiaryView({ beneficiaries }: { beneficiaries: readonly Beneficiary[] }) {
  if (beneficiaries.length === 0) {
    return <p className="text-sm text-fg-muted">No beneficiaries to show.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {beneficiaries.map((b) => (
        <li
          key={b.id}
          data-testid="beneficiary"
          className="space-y-2 rounded-md border border-border p-3 text-sm"
        >
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{b.display_name}</span>
            <SyntheticBadge />
          </p>
          <p className="text-fg-muted">{b.channel}</p>
          <p data-testid="beneficiary-total" className="font-mono">
            {b.received_demo_credits > 0 ? formatCredits(b.received_demo_credits) : "No payout yet"}
          </p>
          {b.entries.length > 0 ? (
            <ul aria-label={`Ledger entries of ${b.display_name}`} className="space-y-1">
              {b.entries.map((entry) => (
                <li key={`${entry.settlement_id}-${entry.amount_demo_credits}`}>
                  <Link
                    href={`/demo/w7-settlement/settlements/${encodeURIComponent(entry.settlement_id)}`}
                    className="underline underline-offset-4"
                  >
                    {entry.settlement_display_id}
                  </Link>{" "}
                  {formatCredits(entry.amount_demo_credits)}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
