import { ECOSYSTEM, ECOSYSTEM_MAP_KEY, ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { COMPONENTS_INDEX } from "@/content/home/copy";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { ComponentLink } from "./component-link";
import { PlateSwatch } from "./plate-swatch";
import { CONTAINER, H2, H3_TITLE, REVEAL_CHILD, SECTION } from "./type";
export function ComponentIndex() {
  return (
    <section
      id="components"
      aria-labelledby="components-heading"
      className={`${SECTION} plate-surface`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-(--space-16)`}>
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
          aria-label={COMPONENTS_INDEX.listLabel.text}
          className="grid min-w-0 gap-4 [counter-reset:key] md:grid-cols-2 lg:grid-cols-3"
        >
          {ECOSYSTEM_SLUGS.map((slug, index) => (
            <li key={slug} className={`relative [counter-increment:key] ${REVEAL_CHILD}`}>
              <ComponentLink
                slug={slug}
                className="hover-lift group grid min-h-11 min-w-0 gap-2 overflow-hidden rounded-lg border border-plate-border/50 bg-plate-elevated/50 p-6 hover:border-plate-fg/40 hover:bg-plate-fg/[0.08] focus-visible:bg-plate-fg/[0.08]"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-3 text-2xl font-medium tracking-[-0.015em] [overflow-wrap:anywhere]">
                  {index % 2 === 0 ? (
                    <LeafIcon className="h-7 w-auto" />
                  ) : (
                    <PillIcon className="h-7 w-auto" />
                  )}
                  <PlateSwatch slug={slug} outline="var(--color-plate-fg)" />
                  {ECOSYSTEM[slug].title}
                </span>
                <span className="block text-plate-muted group-hover:text-plate-fg group-focus-visible:text-plate-fg">
                  {ECOSYSTEM[slug].homeSummary}
                </span>
              </ComponentLink>
            </li>
          ))}
        </ul>
        <figure className="space-y-4 border-t border-plate-border/50 pt-10">
          <h3 className={H3_TITLE}>{COMPONENTS_INDEX.diagramHeading.text}</h3>
          <p className="max-w-[52ch] text-lg leading-relaxed text-plate-muted">
            {COMPONENTS_INDEX.diagramIntro.text}
          </p>
          <ol role="list" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ECOSYSTEM_SLUGS.map((slug, index) => (
              <li key={slug} className="flex gap-3 text-plate-muted">
                <span className="font-mono text-sm">{index + 1}.</span>
                <span>
                  <strong className="font-medium text-plate-fg">{ECOSYSTEM[slug].title}</strong>
                  {" \u2014 "}
                  {ECOSYSTEM[slug].descriptor}
                </span>
              </li>
            ))}
          </ol>
          <figcaption className="max-w-[70ch] space-y-4 text-sm leading-relaxed text-plate-muted">
            <p>{COMPONENTS_INDEX.diagramCaption.text}</p>
            <dl className="grid gap-2 sm:grid-cols-3">
              {ECOSYSTEM_MAP_KEY.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-plate-fg">{item.label}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>
          </figcaption>
          <p className="sr-only">{COMPONENTS_INDEX.diagramAlt.text}</p>
        </figure>
      </div>
    </section>
  );
}
