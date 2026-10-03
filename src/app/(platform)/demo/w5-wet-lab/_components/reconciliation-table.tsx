import { Badge } from "@/components/ui";
import type { Reconciliation } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";
import { DispositionDialog } from "./disposition-dialog";

type Props = Readonly<{ reconciliation: Reconciliation; canDispose: boolean }>;

export function ReconciliationTable({ reconciliation, canDispose }: Props) {
  const held = reconciliation.status === "hold";
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm">
        Reconciliation{" "}
        <Badge
          tone={held ? "warning" : "success"}
          data-testid="reconciliation-status"
          data-status={reconciliation.status}
        >
          {held ? "HOLD" : "reconciled"}
        </Badge>
      </p>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="group"
        aria-label="Sample reconciliation (scrollable)"
      >
        <table className="w-full text-left text-sm" aria-label="Sample reconciliation">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="p-2">
                Sample
              </th>
              <th scope="col" className="p-2">
                Status
              </th>
              <th scope="col" className="p-2">
                Disposition
              </th>
              <th scope="col" className="p-2">
                Owner
              </th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border"
                data-sample={item.sample_ref}
                data-status={item.status}
              >
                <th scope="row" className="p-2 font-mono">
                  {item.sample_ref}
                </th>
                <td className="p-2">{humanize(item.status)}</td>
                <td className="p-2">
                  {item.disposition ? (
                    `${humanize(item.disposition)}${item.rationale ? ` — ${item.rationale}` : ""}`
                  ) : item.status === "matched" ? (
                    "not needed"
                  ) : canDispose ? (
                    <DispositionDialog item={item} />
                  ) : (
                    "open"
                  )}
                </td>
                <td className="p-2">{humanize(item.owner_persona)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
