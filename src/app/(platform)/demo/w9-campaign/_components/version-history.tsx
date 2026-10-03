import type { CharterVersion } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { LockStateText } from "../../_components/status-text";

const thresholdText = (v: CharterVersion): string => {
  const t = v.thresholds;
  return `potency ≤ ${t.potency_um_max} µM, ≥ ${t.replicates_min} replicates, controls ${
    t.controls_required ? "required" : "optional"
  }`;
};

/** Newest first. Charter events are signed; their ids are shown, not linked (A-P5B-08). */
export function VersionHistory({ versions }: { versions: readonly CharterVersion[] }) {
  return (
    <section aria-labelledby="history-heading" className="space-y-3">
      <h2 id="history-heading" className="text-xl font-semibold">
        Protocol versions
      </h2>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="group"
        aria-label="Protocol versions (scrollable)"
      >
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Protocol version history, newest first</caption>
          <thead>
            <tr className="border-b border-border">
              {[
                "Version",
                "State",
                "Thresholds",
                "Revision",
                "Reason",
                "Changed by",
                "When",
                "Signed event",
              ].map((name) => (
                <th key={name} scope="col" className="p-2">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr
                key={version.version}
                data-testid="version-row"
                data-version={version.version}
                className="border-b border-border align-top"
              >
                <th scope="row" className="p-2 font-medium">
                  v{version.version}
                </th>
                <td className="p-2">
                  <LockStateText state={version.locked ? "locked" : "open"} />
                </td>
                <td className="p-2">{thresholdText(version)}</td>
                <td className="p-2">{version.revision}</td>
                <td className="p-2">{version.change_reason}</td>
                <td className="p-2">{version.created_by_persona}</td>
                <td className="p-2">{formatInstant(version.created_at)}</td>
                <td className="p-2 font-mono text-xs">{version.event_id ?? "not signed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-fg-muted">Demo signature, not production key</p>
    </section>
  );
}
