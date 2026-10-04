import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import { Withheld } from "@/components/ui/withheld";
import type { FieldDisclosure } from "@/lib/demo/types";

// A table of FieldDisclosure rows (W8 pack and export). A withheld row shows the word "withheld"
// with its reason code and message and never reads `value`, whatever the row carries (Review Focus 2).
const formatValue = (value: unknown): string =>
  typeof value === "string" ? value : (JSON.stringify(value) ?? "");

function ValueCell({ row }: { row: FieldDisclosure }) {
  if (row.status === "withheld") {
    return (
      <>
        <Withheld field={row.label} />
        {row.withheld_reason ? (
          <p className="text-xs text-fg-muted">
            <span className="font-mono">{row.withheld_reason.code}</span>:{" "}
            {row.withheld_reason.message}
          </p>
        ) : null}
      </>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="break-words">{formatValue(row.value)}</span>
      <SyntheticBadge />
    </span>
  );
}

type Props = Readonly<{
  caption: string;
  rows: readonly FieldDisclosure[];
  emptyText?: string;
}>;

export function FieldDisclosureTable({ caption, rows, emptyText = "No fields." }: Props) {
  if (rows.length === 0) return <p className="text-sm text-fg-muted">{emptyText}</p>;
  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label={`${caption} (scrollable)`}
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="p-2">
              Field
            </th>
            <th scope="col" className="p-2">
              Section
            </th>
            <th scope="col" className="p-2">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              className="border-b border-border align-top"
              data-testid={`field-${row.status}`}
              data-path={row.path}
            >
              <th scope="row" className="p-2 font-medium">
                {row.label}
              </th>
              <td className="p-2">{row.section}</td>
              <td className="p-2">
                <ValueCell row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
