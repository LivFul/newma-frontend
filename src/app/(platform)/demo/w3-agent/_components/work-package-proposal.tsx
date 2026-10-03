import Link from "next/link";
import type { WorkPackageProposal as Proposal } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";

const display = (key: string, value: unknown): string => {
  if (/credits$/.test(key) && typeof value === "number") return `${value} demo credits`;
  if (Array.isArray(value)) return value.join(", ");
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
};

/** A proposal only: the scientist submits it in W5; agents never approve anything (ENT-05). */
export function WorkPackageProposal({
  queryId,
  proposal,
}: {
  queryId: string;
  proposal: Proposal;
}) {
  return (
    <div className="space-y-3">
      <dl className="grid gap-1 text-sm sm:grid-cols-2">
        {Object.entries(proposal).map(([key, value]) => (
          <div key={key}>
            <dt className="text-fg-muted">{humanize(key)}</dt>
            <dd>{display(key, value)}</dd>
          </div>
        ))}
      </dl>
      <Link
        href={`/demo/w5-wet-lab?from=${encodeURIComponent(queryId)}`}
        className="underline underline-offset-4"
      >
        Submit as work package in W5
      </Link>
    </div>
  );
}
