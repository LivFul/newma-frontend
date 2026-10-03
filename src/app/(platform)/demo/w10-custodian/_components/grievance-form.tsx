import type { CustodianAgreement, GrievanceCategory } from "@/lib/demo/types";

const CATEGORY_TEXT: Readonly<Record<GrievanceCategory, string>> = {
  obligation_not_met: "A promise in the agreement was not kept",
  use_outside_agreement: "Something was used in a way the agreement does not allow",
  consent_concern: "I am worried about consent",
  benefit_not_received: "A benefit was not received",
  other: "Something else",
};

const FIELD = "min-h-10 w-full rounded-md border border-border-strong bg-bg-elevated px-3 text-fg";

type Props = Readonly<{ agreement: CustodianAgreement; idempotencyKey: string }>;

/**
 * A plain HTML form: it works without JavaScript. The page renders a fresh key per agreement, so a
 * double submit is a replay at the backend, not a second concern.
 */
export function GrievanceForm({ agreement, idempotencyKey }: Props) {
  const id = agreement.rights_record_id;
  return (
    <form method="post" action="/api/demo/grievances" className="space-y-3">
      <input type="hidden" name="rights_record_id" value={id} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <div className="space-y-1">
        <label htmlFor={`category-${id}`} className="block text-sm font-medium">
          What is your concern about?
        </label>
        <select
          id={`category-${id}`}
          name="category"
          className={FIELD}
          defaultValue="obligation_not_met"
        >
          {Object.entries(CATEGORY_TEXT).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor={`obligation-${id}`} className="block text-sm font-medium">
          Which promise is it about? (optional)
        </label>
        <select id={`obligation-${id}`} name="obligation_id" className={FIELD} defaultValue="">
          <option value="">Not about one promise</option>
          {agreement.obligations.map((obligation) => (
            <option key={obligation.id} value={obligation.id}>
              {obligation.text}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor={`description-${id}`} className="block text-sm font-medium">
          Tell us what happened
        </label>
        <p id={`hint-${id}`} className="text-xs text-fg-muted">
          Write at least 10 characters and at most 1000.
        </p>
        <textarea
          id={`description-${id}`}
          name="description"
          rows={4}
          maxLength={1000}
          aria-describedby={`hint-${id}`}
          className={`${FIELD} py-2`}
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center rounded-md border border-transparent bg-accent px-4 py-2 font-medium text-accent-fg"
      >
        Send concern
      </button>
    </form>
  );
}
