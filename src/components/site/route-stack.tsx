import { ECOSYSTEM_SLUGS, type EcosystemSlug } from "@/content/ecosystem/registry";
import { SURVEY_LABELS } from "@/content/home/survey";
import { PlateSwatch } from "./plate-swatch";

export function RouteStack({
  current,
  className = "",
}: {
  current: EcosystemSlug;
  className?: string;
}) {
  const index = ECOSYSTEM_SLUGS.indexOf(current);
  return (
    <div aria-hidden="true" className={`flex items-center gap-4 ${className}`}>
      <div className="relative flex flex-col items-center gap-1 py-1">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brand" />
        {ECOSYSTEM_SLUGS.map((slug) => (
          <PlateSwatch
            key={slug}
            slug={slug}
            className={`relative h-6 w-6 ${slug === current ? "" : "opacity-25"}`}
          />
        ))}
      </div>
      <p className="gridref text-fg-muted">
        {SURVEY_LABELS.sheet.text} {index + 1} / {ECOSYSTEM_SLUGS.length}
      </p>
    </div>
  );
}
