import { IllustrativeBadge, SyntheticBadge } from "@/components/ui";
import { CREDITS_UNIT, formatBasisPoints } from "@/lib/credits";
import type { AgreementView } from "@/lib/demo/types";

/** The seeded agreement's illustrative rules: basis points per fictional beneficiary and reserve. */
export function AgreementRules({ agreement }: { agreement: AgreementView }) {
  return (
    <div data-testid="agreement-rules" className="space-y-2 rounded-md border border-border p-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">
          Agreement version {agreement.version}: {agreement.authority}
        </span>
        <IllustrativeBadge />
        <SyntheticBadge />
      </p>
      <ul className="space-y-1 text-sm">
        {agreement.rules.map((rule) => (
          <li key={rule.beneficiary_id} className="flex flex-wrap items-center gap-2">
            <span>{rule.beneficiary_display_name}</span>
            <span className="font-mono">{formatBasisPoints(rule.share_basis_points)}</span>
            <IllustrativeBadge />
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-2">
          <span>Reserve (illustrative)</span>
          <span className="font-mono">{formatBasisPoints(agreement.reserve_basis_points)}</span>
          <IllustrativeBadge />
        </li>
      </ul>
      <p className="text-xs text-fg-muted">
        Shares apply to net amounts in {CREDITS_UNIT}; they are illustrative, not terms of any real
        agreement.
      </p>
    </div>
  );
}
