import Link from "next/link";
import type { License } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";
import { W7StateBadge } from "./state-badge";

export function LicenseList({ licenses }: { licenses: readonly License[] }) {
  if (licenses.length === 0) return <p className="text-sm text-fg-muted">No licenses yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {licenses.map((license) => (
        <li key={license.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
          <Link
            href={`/demo/w7-settlement/licenses/${encodeURIComponent(license.id)}`}
            className="font-medium underline underline-offset-4"
          >
            {license.display_id}
            <span className="sr-only"> {license.licensee_display_name}</span>
          </Link>
          <span className="text-sm">{license.licensee_display_name}</span>
          <W7StateBadge vocabulary="license" value={license.status} />
          <span className="text-sm text-fg-muted">
            {humanize(license.purpose)} · agreement version {license.agreement.version}
          </span>
        </li>
      ))}
    </ul>
  );
}
