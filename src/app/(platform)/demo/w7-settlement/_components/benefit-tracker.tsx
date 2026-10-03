import Link from "next/link";
import { SyntheticBadge } from "@/components/ui";
import { canAct } from "@/lib/demo/persona-actions";
import type { BenefitItem } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { formatInstant } from "../../_components/fields";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { DeliverDialog } from "./deliver-dialog";
import { ScheduleDialog } from "./schedule-dialog";
import { W7StateBadge } from "./state-badge";

type Props = Readonly<{ items: readonly BenefitItem[]; persona: PersonaId }>;

function Controls({ item, manage }: { item: BenefitItem; manage: boolean }) {
  if (!manage) return null;
  if (item.status === "planned") return <ScheduleDialog benefitId={item.id} />;
  if (item.status === "scheduled") return <DeliverDialog benefitId={item.id} />;
  return null;
}

/** Non-monetary benefits (A-P5A-14): planned, scheduled, delivered; no value is ever attached. */
export function BenefitTracker({ items, persona }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-fg-muted">Benefit items appear when a license is approved.</p>
    );
  }
  const manage = canAct(persona, "manage_benefit");
  const open = items.some((item) => item.status !== "delivered");
  return (
    <div className="space-y-3">
      <ul
        aria-label="Benefit items"
        className="divide-y divide-border rounded-md border border-border"
      >
        {items.map((item) => (
          <li
            key={item.id}
            data-testid="benefit-item"
            data-status={item.status}
            className="space-y-1 px-3 py-2 text-sm"
          >
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              <W7StateBadge vocabulary="benefit" value={item.status} />
              <SyntheticBadge />
              <Link
                href={`/demo/w7-settlement/licenses/${encodeURIComponent(item.license_id)}`}
                className="text-fg-muted underline underline-offset-4"
              >
                License {item.license_display_id}
              </Link>
            </p>
            {item.scheduled_for ? <p>Scheduled for {item.scheduled_for}</p> : null}
            {item.delivered_at ? <p>Delivered {formatInstant(item.delivered_at)}</p> : null}
            {item.evidence_note ? (
              <p className="text-fg-muted">Evidence: {item.evidence_note}</p>
            ) : null}
            <Controls item={item} manage={manage} />
          </li>
        ))}
      </ul>
      {!manage && open ? <PersonaForbiddenNotice allowed={["community_liaison"]} /> : null}
    </div>
  );
}
