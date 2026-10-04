import Link from "next/link";
import type { ExportRecord } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { FieldDisclosureTable } from "../../_components/field-disclosure";
import { ExportStatusText } from "../../_components/status-text";
import { decisionTimelineHref } from "./w8-href";

/** The issued export: recipient, expiry, what was disclosed and what was withheld, and why. */
export function ExportResult({ record }: { record: ExportRecord }) {
  return (
    <section
      aria-label="Export issued"
      className="space-y-3 rounded-md border border-border-strong p-4"
    >
      <h3 className="text-lg font-semibold">Export issued</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">Status</dt>
          <dd>
            <ExportStatusText status={record.status} />
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Recipient</dt>
          <dd>{record.recipient}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Purpose</dt>
          <dd>{record.purpose}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Expires</dt>
          <dd>{formatInstant(record.expires_at)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Stage and package</dt>
          <dd>
            {record.stage}, version {record.package_version}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Signature</dt>
          <dd>{record.signature_label}</dd>
        </div>
      </dl>
      <h4 className="font-semibold">Disclosed ({record.disclosed.length})</h4>
      <FieldDisclosureTable caption="Disclosed in this export" rows={record.disclosed} />
      <h4 className="font-semibold">Withheld ({record.withheld.length})</h4>
      <FieldDisclosureTable caption="Withheld from this export" rows={record.withheld} />
      <Link
        href={decisionTimelineHref(record.policy_decision_id)}
        className="underline underline-offset-4"
      >
        Show signed events
      </Link>
    </section>
  );
}
