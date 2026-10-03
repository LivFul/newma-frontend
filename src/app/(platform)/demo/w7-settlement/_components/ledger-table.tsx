import { formatBasisPoints, formatCredits } from "@/lib/credits";
import type { Calculation, LedgerEntry } from "@/lib/demo/types";
import { formatInstant, humanize } from "../../_components/fields";
import { ConservationStatus } from "./calculation-table";

type Props = Readonly<{ ledger: readonly LedgerEntry[]; calculation: Calculation | null }>;

const label = (entry: LedgerEntry) =>
  entry.kind === "beneficiary"
    ? (entry.beneficiary_display_name ?? "Beneficiary")
    : entry.kind === "reserve"
      ? "Reserve (illustrative)"
      : "Rounding residual (carried to the reserve pool)";

/** Posted distribution in demo credits; empty until the settlement is paid. */
export function LedgerTable({ ledger, calculation }: Props) {
  if (ledger.length === 0) {
    return <p className="text-sm text-fg-muted">No payout: nothing has been posted</p>;
  }
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Distribution ledger in demo credits (illustrative)</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-1 pr-3">
                Kind
              </th>
              <th scope="col" className="py-1 pr-3">
                Beneficiary
              </th>
              <th scope="col" className="py-1 pr-3">
                Share
              </th>
              <th scope="col" className="py-1 pr-3 text-right">
                Amount
              </th>
              <th scope="col" className="py-1">
                Posted
              </th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr
                key={entry.id}
                data-testid="ledger-row"
                data-kind={entry.kind}
                className="border-b border-border"
              >
                <td className="py-1 pr-3">{humanize(entry.kind)}</td>
                <td className="py-1 pr-3">{label(entry)}</td>
                <td className="py-1 pr-3 font-mono">
                  {entry.kind === "residual" ? "—" : formatBasisPoints(entry.share_basis_points)}
                </td>
                <td className="py-1 pr-3 text-right font-mono">
                  {formatCredits(entry.amount_demo_credits)}
                </td>
                <td className="py-1">{formatInstant(entry.posted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {calculation ? (
        <ConservationStatus
          lines={ledger}
          distributable={calculation.distributable_demo_credits}
          testId="ledger-conservation"
        />
      ) : null}
    </div>
  );
}
