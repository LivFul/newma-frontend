import { Badge } from "@/components/ui";
import { DEMO_BANNER_TEXT } from "@/lib/demo/banner";

// Shown on every /demo/* page by the demo layout.
export { DEMO_BANNER_TEXT };

export function DemoBanner() {
  return (
    <aside
      role="note"
      aria-label="Demo notice"
      className="flex flex-wrap items-center gap-3 border-b border-warning bg-bg-elevated px-4 py-2 text-sm"
    >
      <Badge tone="warning">Synthetic</Badge>
      <p className="m-0">{DEMO_BANNER_TEXT}</p>
    </aside>
  );
}
