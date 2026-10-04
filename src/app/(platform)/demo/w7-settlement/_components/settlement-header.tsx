import Link from "next/link";
import { Badge, SyntheticBadge } from "@/components/ui";
import type { Settlement } from "@/lib/demo/types";
import { AgreementRules } from "./agreement-rules";
import { W7StateBadge } from "./state-badge";
import { StateStepper } from "./state-stepper";

export function SettlementHeader({ settlement }: { settlement: Settlement }) {
  return (
    <section aria-labelledby="state-heading" className="space-y-3">
      <h2 id="state-heading" className="flex flex-wrap items-center gap-3 text-xl font-semibold">
        Settlement {settlement.display_id}
        <W7StateBadge vocabulary="settlement" value={settlement.state} />
        {settlement.seeded_example ? (
          <>
            <Badge>Seeded example</Badge>
            <SyntheticBadge />
          </>
        ) : null}
      </h2>
      {settlement.license_id ? (
        <p className="text-sm">
          License{" "}
          <Link
            href={`/demo/w7-settlement/licenses/${encodeURIComponent(settlement.license_id)}`}
            className="underline underline-offset-4"
          >
            {settlement.license_display_id ?? settlement.license_id}
          </Link>
        </p>
      ) : (
        <p className="text-sm text-fg-muted">Seeded example: no license is attached.</p>
      )}
      <StateStepper state={settlement.state} />
      <AgreementRules agreement={settlement.agreement} />
    </section>
  );
}
