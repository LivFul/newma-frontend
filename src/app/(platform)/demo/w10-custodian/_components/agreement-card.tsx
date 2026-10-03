import { SyntheticBadge } from "@/components/ui/synthetic-badge";
import type { CustodianAgreement, CustodianUse } from "@/lib/demo/types";
import { GrievanceForm } from "./grievance-form";
import { GrievanceList } from "./grievance-list";
import { ObligationsTable } from "./obligations-table";

function UseList({ label, uses }: { label: string; uses: readonly CustodianUse[] }) {
  return (
    <div>
      <h3 className="font-medium">{label}</h3>
      {uses.length === 0 ? (
        <p className="text-sm">Nothing is listed.</p>
      ) : (
        <ul aria-label={label} className="list-disc space-y-1 pl-5 text-sm">
          {uses.map((use) => (
            <li key={use.purpose}>{use.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = Readonly<{ agreement: CustodianAgreement; idempotencyKey: string }>;

/** One agreement in plain language: what it says, its promises, and the concerns about it. */
export function AgreementCard({ agreement, idempotencyKey }: Props) {
  const headingId = `agreement-${agreement.rights_record_id}`;
  return (
    <article aria-labelledby={headingId} className="space-y-4 rounded-md border border-border p-4">
      <h2 id={headingId} className="text-xl font-semibold">
        {agreement.title} <SyntheticBadge />
      </h2>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="font-medium">Who made this agreement</dt>
          <dd>{agreement.authority}</dd>
        </div>
        <div>
          <dt className="font-medium">Where it stands</dt>
          <dd>
            {agreement.status === "withdrawn" ? "This agreement has been taken back. " : null}
            {agreement.status_text}
          </dd>
        </div>
        <div>
          <dt className="font-medium">How long it lasts</dt>
          <dd>{agreement.validity_text}</dd>
        </div>
      </dl>
      <h3 className="text-lg font-semibold">What this agreement says</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <UseList label="What is allowed" uses={agreement.uses_allowed} />
        <UseList label="What is not allowed" uses={agreement.uses_not_allowed} />
      </div>
      <ObligationsTable obligations={agreement.obligations} title={agreement.title} />
      <h3 className="text-lg font-semibold">Concerns</h3>
      <GrievanceList grievances={agreement.grievances} />
      {agreement.can_raise_grievance ? (
        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer font-medium">
            Raise a concern about this agreement
          </summary>
          <div className="pt-3">
            <GrievanceForm agreement={agreement} idempotencyKey={idempotencyKey} />
          </div>
        </details>
      ) : (
        <p className="text-sm">Only a community liaison can send a concern.</p>
      )}
    </article>
  );
}
