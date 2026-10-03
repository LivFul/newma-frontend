import { SyntheticBadge } from "@/components/ui";
import type { BenefitItem } from "@/lib/demo/types";
import { formatInstant } from "../../_components/fields";
import { W7StateBadge } from "./state-badge";

type Props = Readonly<{ items: readonly BenefitItem[] }>;

/** Non-monetary benefits of a license (A-P5A-14): no value is ever attached to them. */
export function BenefitTracker({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-fg-muted">Benefit items appear when the license is approved.</p>
    );
  }
  return (
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
          </p>
          {item.scheduled_for ? <p>Scheduled for {item.scheduled_for}</p> : null}
          {item.delivered_at ? <p>Delivered {formatInstant(item.delivered_at)}</p> : null}
          {item.evidence_note ? (
            <p className="text-fg-muted">Evidence: {item.evidence_note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
