import type { ExportSummary } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { ExportStatusText } from "../../_components/status-text";

/** The tenant's exports, newest first. A suspended or expired export never shows its body. */
export function ExportRegister({ exports }: { exports: readonly ExportSummary[] }) {
  if (exports.length === 0) return <p className="text-sm text-fg-muted">No exports yet.</p>;
  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label="Export register (scrollable)"
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Export register</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="p-2">
              Asset
            </th>
            <th scope="col" className="p-2">
              Recipient
            </th>
            <th scope="col" className="p-2">
              Purpose
            </th>
            <th scope="col" className="p-2">
              Expires
            </th>
            <th scope="col" className="p-2">
              Fields
            </th>
            <th scope="col" className="p-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {exports.map((entry) => (
            <tr
              key={entry.id}
              data-testid="export-row"
              data-status={entry.status}
              className="border-b border-border align-top"
            >
              <th scope="row" className="p-2 font-medium">
                {entry.display_id} <span className="font-mono">{entry.stage}</span>
              </th>
              <td className="p-2">{entry.recipient}</td>
              <td className="p-2">{entry.purpose}</td>
              <td className="p-2">{formatInstant(entry.expires_at)}</td>
              <td className="p-2">
                {entry.disclosed_count} disclosed, {entry.withheld_count} withheld
              </td>
              <td className="p-2">
                <ExportStatusText status={entry.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
