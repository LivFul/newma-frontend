import { formatCredits } from "@/lib/credits";
import type { Receipt, Settlement } from "@/lib/demo/types";
import { isPersonaId, personaLabel } from "@/lib/personas";
import { W7StateBadge } from "./state-badge";

type Props = Readonly<{
  receipts: readonly Receipt[];
  totals: Settlement["totals"];
  /** The original row of a duplicate refusal, emphasised until the next refresh. */
  highlightId?: string;
}>;

const who = (persona: string | null) =>
  persona === null ? "—" : isPersonaId(persona) ? personaLabel(persona) : persona;

function Note({ receipt, all }: { receipt: Receipt; all: readonly Receipt[] }) {
  if (receipt.status === "duplicate") {
    const of = all.find((r) => r.id === receipt.duplicate_of)?.external_ref ?? receipt.duplicate_of;
    return <>rejected, not counted — duplicate of {of}</>;
  }
  if (receipt.status === "disputed") {
    return (
      <>
        held — not payable
        {receipt.dispute_reason ? <span className="block">{receipt.dispute_reason}</span> : null}
      </>
    );
  }
  return null;
}

/** Receipts of one settlement; only `recorded` rows count, `disputed` is held, `duplicate` is struck. */
export function ReceiptsTable({ receipts, totals, highlightId }: Props) {
  if (receipts.length === 0) {
    return <p className="text-sm text-fg-muted">No receipts recorded yet.</p>;
  }
  const n = totals.duplicate_count;
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Receipts in demo credits</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-1 pr-3">
                Reference
              </th>
              <th scope="col" className="py-1 pr-3">
                Amount
              </th>
              <th scope="col" className="py-1 pr-3">
                Status
              </th>
              <th scope="col" className="py-1 pr-3">
                Recorded by
              </th>
              <th scope="col" className="py-1">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => {
              const struck = receipt.status === "duplicate" ? "line-through text-fg-muted" : "";
              return (
                <tr
                  key={receipt.id}
                  data-testid="receipt-row"
                  data-status={receipt.status}
                  data-highlighted={receipt.id === highlightId ? "true" : undefined}
                  className="border-b border-border data-[highlighted=true]:bg-warning/20"
                >
                  <td className="py-1 pr-3 font-mono">
                    <span className={struck}>{receipt.external_ref}</span>
                    {receipt.id === highlightId ? (
                      <span className="sr-only"> (original of the rejected duplicate)</span>
                    ) : null}
                  </td>
                  <td className="py-1 pr-3">
                    <span className={struck}>{formatCredits(receipt.amount_demo_credits)}</span>
                  </td>
                  <td className="py-1 pr-3">
                    <W7StateBadge vocabulary="receipt" value={receipt.status} />
                  </td>
                  <td className="py-1 pr-3">{who(receipt.recorded_by_persona)}</td>
                  <td className="py-1">
                    <Note receipt={receipt} all={receipts} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p data-testid="receipt-totals" className="text-sm">
        {formatCredits(totals.recorded_demo_credits)} recorded ·{" "}
        {formatCredits(totals.held_demo_credits)} held — not payable · {n} duplicate
        {n === 1 ? "" : "s"} rejected
      </p>
    </div>
  );
}
