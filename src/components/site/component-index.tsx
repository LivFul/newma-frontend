import { ECOSYSTEM_SLUGS, HERO_LABELS } from "@/content/ecosystem/registry";
import { COMPONENTS_INDEX } from "@/content/home/copy";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { ComponentLink } from "./component-link";
import { PlateSwatch } from "./plate-swatch";
import { CONTAINER, H2, SECTION } from "./type";

export function ComponentIndex() {
  return (
    <section
      id="components"
      aria-labelledby="components-heading"
      className={`${SECTION} plate-surface`}
      data-reveal
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
        <ul
          role="list"
          className="grid min-w-0 gap-4 [counter-reset:key] md:grid-cols-2 lg:grid-cols-3"
        >
          {ECOSYSTEM_SLUGS.map((slug, index) => (
            <li key={slug} className="relative [counter-increment:key]">
              <ComponentLink
                slug={slug}
                className="group grid min-h-11 min-w-0 gap-2 overflow-hidden rounded-lg border border-plate-border/50 bg-plate-elevated/50 p-6 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-plate-fg/[0.08] focus-visible:bg-plate-fg/[0.08]"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-3 text-2xl font-medium tracking-[-0.015em] [overflow-wrap:anywhere]">
                  {index % 2 === 0 ? (
                    <LeafIcon className="h-7 w-auto" />
                  ) : (
                    <PillIcon className="h-7 w-auto" />
                  )}
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
