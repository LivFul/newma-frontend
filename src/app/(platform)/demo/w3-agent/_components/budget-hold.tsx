import type { AgentQuery } from "@/lib/demo/types";

export function BudgetHold({ query }: { query: AgentQuery }) {
  return (
    <section
      aria-label="Budget hold"
      className="space-y-2 rounded-md border border-warning p-4 text-sm"
    >
      <p className="font-semibold">Held: the budget check did not pass.</p>
      <p>
        Requested {query.budget.requested_credits} demo credits; estimated{" "}
        {query.budget.estimated_credits} demo credits; remaining quota{" "}
        {query.budget.remaining_quota} demo credits.
      </p>
      <ul className="list-disc pl-5">
        {query.remediation.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {query.job_ids.length === 0 ? <p>No simulated jobs were submitted.</p> : null}
    </section>
  );
}
