import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import { ECOSYSTEM_SLUGS, HERO_LABELS, type EcosystemSlug } from "@/content/ecosystem/registry";
import { ComponentLink } from "./component-link";
import { PlateSwatch } from "./plate-swatch";

// Sibling links between the six pages: a plain, crawlable internal-link set.
export function RelatedComponents({ current }: { current: EcosystemSlug }) {
  return (
    <nav aria-labelledby="related-heading" className="mt-14 border-t border-fg pt-6">
      <h2 id="related-heading" className="text-2xl font-medium tracking-[-0.015em]">
        {DETAIL_COPY.relatedHeading.text}
      </h2>
      <ul role="list" className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {ECOSYSTEM_SLUGS.filter((slug) => slug !== current).map((slug) => (
          <li key={slug} className="border-t border-fg/15">
            <ComponentLink
              slug={slug}
              className="flex min-h-12 items-center gap-3 py-3 text-lg hover:bg-bg-deep hover:underline focus-visible:bg-bg-deep focus-visible:underline"
            >
              <PlateSwatch slug={slug} />
              {HERO_LABELS[slug].title}
            </ComponentLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
