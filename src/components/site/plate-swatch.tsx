import { PARTS } from "@/components/ecosystem-graphic/geometry";
import type { EcosystemSlug } from "@/content/ecosystem/registry";

const TONE = new Map<EcosystemSlug, string>(PARTS.map((p) => [p.slug, p.tone]));
const DASHED = new Set<EcosystemSlug>(PARTS.filter((p) => p.dashed).map((p) => p.slug));

export function PlateSwatch({
  slug,
  outline = "var(--color-fg)",
  className = "h-6 w-6 shrink-0",
}: {
  slug: EcosystemSlug;
  outline?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={`var(${TONE.get(slug)})`}
        stroke={outline}
        strokeWidth="1.25"
        strokeDasharray={DASHED.has(slug) ? "3 2.5" : undefined}
      />
    </svg>
  );
}
