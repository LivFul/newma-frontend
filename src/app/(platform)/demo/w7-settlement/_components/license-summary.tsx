import { Badge, SyntheticBadge } from "@/components/ui";
import type { License } from "@/lib/demo/types";
import { formatInstant, humanize } from "../../_components/fields";
import { AgreementRules } from "./agreement-rules";
import { W7StateBadge } from "./state-badge";

export function LicenseSummary({ license }: { license: License }) {
  return (
    <section aria-labelledby="summary-heading" className="space-y-3">
      <h2 id="summary-heading" className="flex flex-wrap items-center gap-3 text-xl font-semibold">
        License <W7StateBadge vocabulary="license" value={license.status} />
        <SyntheticBadge />
      </h2>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">Licensee</dt>
          <dd>{license.licensee_display_name}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Purpose</dt>
          <dd>{humanize(license.purpose)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Term</dt>
          <dd>{license.term_months} months</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Agreement</dt>
          <dd>
            agreement version {license.agreement.version}
            {license.agreement.latest ? null : <Badge tone="warning"> superseded</Badge>}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-fg-muted">Scope</dt>
          <dd>{license.scope_summary}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Requested</dt>
          <dd>{formatInstant(license.created_at)}</dd>
        </div>
        {license.decision ? (
          <div>
            <dt className="text-fg-muted">Decision</dt>
            <dd>
              {license.decision.decision} by {license.decision.decided_by_persona}:{" "}
              {license.decision.rationale}
            </dd>
          </div>
        ) : null}
      </dl>
      <AgreementRules agreement={license.agreement} />
    </section>
  );
}
