import { Badge } from "@/components/ui";

// Verbatim from PROGRESS.md §3.1; shown on every /demo/* page by the demo layout.
export const DEMO_BANNER_TEXT =
  "Demo with synthetic data. Not evidence of scientific performance, deployment or compliance (PRD front matter).";

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
