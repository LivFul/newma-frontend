import { ECOSYSTEM_SLUGS, HERO_LABELS } from "@/content/ecosystem/registry";
import { COMPONENTS_INDEX } from "@/content/home/copy";
import { ComponentLink } from "./component-link";
import { PlateSwatch } from "./plate-swatch";
import { CONTAINER, H2, SECTION } from "./type";

// The map legend, printed on the deep plate: the text twin of the hero graphic, the same six links
// readable without any diagram. Keys are numbered by CSS, so link text stays title plus descriptor.
export function ComponentIndex() {
  return (
    <section
      id="components"
      aria-labelledby="components-heading"
      className={`${SECTION} plate-surface`}
    >
      <div className={`${CONTAINER} space-y-14`}>
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="components-heading" className={`${H2} lg:col-span-7`}>
            {COMPONENTS_INDEX.heading.text}
          </h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-plate-muted lg:col-span-5 lg:mt-3">
            {COMPONENTS_INDEX.intro.text}
          </p>
        </div>
        <ul role="list" className="grid [counter-reset:key] md:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM_SLUGS.map((slug) => (
            <li
              key={slug}
              className="relative border-t border-plate-muted/40 [counter-increment:key] before:pointer-events-none before:absolute before:top-7 before:left-0 before:font-mono before:text-xs before:text-plate-muted before:content-[counter(key)]"
            >
              <ComponentLink
                slug={slug}
                className="group grid min-h-11 gap-2 py-6 pr-6 pl-8 transition-colors hover:bg-plate-fg/[0.06] focus-visible:bg-plate-fg/[0.06]"
              >
                <span className="flex items-center gap-3 text-2xl font-medium tracking-[-0.015em]">
                  <PlateSwatch slug={slug} outline="var(--color-plate-fg)" />
                  {HERO_LABELS[slug].title}
                </span>
                <span className="block text-plate-muted group-hover:text-plate-fg group-focus-visible:text-plate-fg">
                  {HERO_LABELS[slug].descriptor}
                </span>
              </ComponentLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
