import { PARTS } from "@/components/ecosystem-graphic/geometry";
import type { EcosystemSlug } from "@/content/ecosystem/registry";

const TONE = new Map<EcosystemSlug, string>(PARTS.map((p) => [p.slug, p.tone]));
const DASHED = new Set<EcosystemSlug>(PARTS.filter((p) => p.dashed).map((p) => p.slug));

// A component's plate in miniature, so legend keys match their layer in the hero. Decorative.
export function PlateSwatch({
  slug,
  outline = "var(--color-fg)",
  className = "h-5 w-10 shrink-0",
}: {
  slug: EcosystemSlug;
  outline?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 44 22" className={className} aria-hidden="true" focusable="false">
      <path
        d="M22 2L42 11L22 20L2 11Z"
        fill={`var(${TONE.get(slug)})`}
        stroke={outline}
        strokeWidth="1.25"
        strokeDasharray={DASHED.has(slug) ? "3 2.5" : undefined}
      />
    </svg>
  );
}
