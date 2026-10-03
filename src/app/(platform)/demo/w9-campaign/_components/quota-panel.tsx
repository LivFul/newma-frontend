import Link from "next/link";
import { SyntheticBadge } from "@/components/ui";
import type { CreditUsage } from "@/lib/demo/types";

const credits = (n: number) => `${n} demo credits`;

export function meterText(usage: Pick<CreditUsage, "remaining" | "credit_quota" | "exhausted">) {
  const base = `${usage.remaining} of ${credits(usage.credit_quota)} remaining`;
  return usage.exhausted ? `Exhausted: ${base}` : base;
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd>{credits(value)}</dd>
    </div>
  );
}

/** Quota, spent, reserved and remaining, with a text meter (never a bar alone). */
export function QuotaPanel({ usage }: { usage: CreditUsage }) {
  return (
    <section aria-label="Credit quota" className="space-y-3">
      <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
        Credit quota <SyntheticBadge />
      </h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-5">
        <Figure label="Quota" value={usage.credit_quota} />
        <Figure label="Committed" value={usage.committed} />
        <Figure label="Spent" value={usage.spent} />
        <Figure label="Reserved" value={usage.reserved} />
        <Figure label="Remaining" value={usage.remaining} />
      </dl>
      <div data-testid="quota-meter" className="space-y-1">
        <meter
          aria-label="Committed demo credits"
          min={0}
          max={Math.max(usage.credit_quota, 1)}
          value={Math.min(Math.max(usage.committed, 0), Math.max(usage.credit_quota, 1))}
          className="h-3 w-full"
        />
        <p className="text-sm font-medium">{meterText(usage)}</p>
      </div>
      {usage.by_kind.length === 0 && usage.jobs.length === 0 ? (
        <p className="text-sm text-fg-muted">No jobs count against the quota yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <table className="text-left text-sm">
            <caption className="text-left font-medium">Credits by kind</caption>
            <tbody>
              {usage.by_kind.map((entry) => (
                <tr key={entry.kind} className="border-b border-border">
                  <th scope="row" className="p-2 font-medium">
                    {entry.kind}
                  </th>
                  <td className="p-2">{entry.jobs} jobs</td>
                  <td className="p-2">{credits(entry.credits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="text-left text-sm">
            <caption className="text-left font-medium">Recent jobs</caption>
            <tbody>
              {usage.jobs.map((job) => (
                <tr key={job.job_id} data-testid="usage-job" className="border-b border-border">
                  <th scope="row" className="p-2 font-medium">
                    <Link
                      href={`/demo/jobs/${encodeURIComponent(job.job_id)}`}
                      className="underline underline-offset-4"
                    >
                      {job.kind} job
                    </Link>
                  </th>
                  <td className="p-2">{job.state}</td>
                  <td className="p-2">{credits(job.credits)}</td>
                  <td className="p-2">counted as {job.counted_as}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
