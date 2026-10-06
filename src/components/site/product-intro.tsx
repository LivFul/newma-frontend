import { HOW_IT_WORKS } from "@/content/home/how-it-works";
import { PRODUCT } from "@/content/home/copy";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { AccessLink } from "./access-link";
import { PersonaGrid } from "./persona-grid";
import { CONTAINER, H2, H3_TITLE, SECTION, STATEMENT } from "./type";

const WAYPOINT =
  "relative grid content-start gap-3 pl-14 lg:pl-0 lg:pt-16 " + "[counter-increment:step]";

export function ProductIntro() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className={`${SECTION} bg-bg-deep/40`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-24`}>
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <h2 id="product-heading" className={H2}>
              {PRODUCT.heading.text}
            </h2>
            <p className={`${STATEMENT} max-w-[30ch]`}>{PRODUCT.what.text}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-bg-elevated p-6 shadow-sm lg:col-span-5 lg:mt-3">
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-cover bg-center opacity-30"
              style={{
                backgroundImage:
                  'image-set(url("/images/lab-glassware.webp") type("image/webp"), url("/images/lab-glassware.jpg") type("image/jpeg"))',
              }}
              aria-hidden="true"
            />
            <div className="relative space-y-4">
              <h3 className={H3_TITLE}>{PRODUCT.problemHeading.text}</h3>
              <p className="max-w-[48ch] text-lg leading-relaxed text-fg-muted">
                {PRODUCT.problem.text}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <h3 className={H3_TITLE}>{PRODUCT.howHeading.text}</h3>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute top-5 bottom-0 left-[1.125rem] w-px bg-brand lg:top-[2.35rem] lg:right-8 lg:bottom-auto lg:left-8 lg:h-px lg:w-auto"
            />
            <ol
              role="list"
              className="relative grid gap-12 [counter-reset:step] lg:grid-cols-4 lg:gap-10"
            >
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step.title.id} className={WAYPOINT}>
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 grid size-9 place-items-center lg:left-1/2 lg:-translate-x-1/2"
                  >
                    {index % 2 === 0 ? (
                      <LeafIcon className="h-9 w-auto" />
                    ) : (
                      <PillIcon className="h-9 w-auto" />
                    )}
                    <span className="absolute font-mono text-[0.65rem] text-fg">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <p className="text-xl font-medium tracking-[-0.01em]">{step.title.text}</p>
                  <p className="max-w-[38ch] leading-relaxed text-fg-muted">{step.text.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-8 border-t border-border pt-10 md:flex-row md:items-center md:justify-between">
            <p className={`${STATEMENT} flex max-w-[34ch] items-start gap-4`}>
              <LeafIcon className="mt-1.5 h-8 w-auto shrink-0" />
              <span>{PRODUCT.guardrail.text}</span>
            </p>
            <AccessLink variant="primary" size="lg" className="min-h-12 self-start md:self-auto">
              {PRODUCT.demoCta.text}
            </AccessLink>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className={H3_TITLE}>{PRODUCT.personasHeading.text}</h3>
          <PersonaGrid />
          <p className="max-w-[60ch] text-sm text-fg-muted">{PRODUCT.supportingRoles.text}</p>
        </div>
      </div>
    </section>
  );
}
