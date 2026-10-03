import { ECOSYSTEM_SLUGS, HERO_LABELS } from "@/content/ecosystem/registry";
import { COMPONENTS_INDEX } from "@/content/home/copy";
import { ComponentLink } from "./component-link";

// The text twin of the hero graphic: the same six links, readable without any diagram.
export function ComponentIndex() {
  return (
    <section
      id="components"
      aria-labelledby="components-heading"
      className="border-t border-border py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-8">
        <div className="space-y-3">
          <h2 id="components-heading" className="font-display text-3xl tracking-tight text-balance">
            {COMPONENTS_INDEX.heading.text}
          </h2>
          <p className="max-w-[58ch] text-fg-muted">{COMPONENTS_INDEX.intro.text}</p>
        </div>
        <ul role="list" className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM_SLUGS.map((slug) => (
            <li key={slug} className="border-t border-border">
              <ComponentLink
                slug={slug}
                className="block min-h-11 space-y-1 py-4 hover:bg-bg-elevated"
              >
                <span className="block font-display text-xl">{HERO_LABELS[slug].title}</span>
                <span className="block text-fg-muted">{HERO_LABELS[slug].descriptor}</span>
              </ComponentLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
