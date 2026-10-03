import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import { ECOSYSTEM_SLUGS, HERO_LABELS, type EcosystemSlug } from "@/content/ecosystem/registry";
import { ComponentLink } from "./component-link";

// Sibling links between the six pages: a plain, crawlable internal-link set.
export function RelatedComponents({ current }: { current: EcosystemSlug }) {
  return (
    <nav aria-labelledby="related-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="related-heading" className="font-display text-2xl tracking-tight">
        {DETAIL_COPY.relatedHeading.text}
      </h2>
      <ul role="list" className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {ECOSYSTEM_SLUGS.filter((slug) => slug !== current).map((slug) => (
          <li
            key={slug}
            className="border-t border-border first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
          >
            <ComponentLink
              slug={slug}
              className="block min-h-11 py-3 text-accent underline underline-offset-4 hover:text-fg"
            >
              {HERO_LABELS[slug].title}
            </ComponentLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
