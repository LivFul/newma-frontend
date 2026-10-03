import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import type { CustodianView } from "@/lib/demo/types";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One plain sentence and the counts behind it. Every figure is synthetic. */
export function Summary({ summary }: { summary: CustodianView["summary"] }) {
  const late = summary.obligations_overdue;
  return (
    <section aria-label="At a glance" className="space-y-2">
      <p className="text-lg">
        This page shows {plural(summary.agreements, "agreement", "agreements")} about your
        community&apos;s knowledge. {summary.obligations_fulfilled} of{" "}
        {plural(summary.obligations, "promise", "promises")} are done, and {late}{" "}
        {late === 1 ? "is" : "are"} late. There {summary.open_grievances === 1 ? "is" : "are"}{" "}
        {plural(summary.open_grievances, "open concern", "open concerns")}. <SyntheticBadge />
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-fg-muted">Agreements</dt>
          <dd>{summary.agreements}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Uses allowed</dt>
          <dd>{summary.uses_allowed}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Promises</dt>
          <dd>{summary.obligations}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Open concerns</dt>
          <dd>{summary.open_grievances}</dd>
        </div>
      </dl>
    </section>
  );
}
