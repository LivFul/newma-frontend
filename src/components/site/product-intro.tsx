import { HOW_IT_WORKS } from "@/content/home/how-it-works";
import { PRODUCT } from "@/content/home/copy";
import { AccessLink } from "./access-link";
import { PersonaGrid } from "./persona-grid";

const COUNTER_ITEM =
  "relative grid gap-1 border-t border-border py-5 pl-12 [counter-increment:step] " +
  "before:absolute before:left-0 before:top-5 before:font-display before:text-2xl before:text-accent " +
  "before:content-[counter(step)]";

export function ProductIntro() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="border-t border-border py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl space-y-16 px-4 md:px-8">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-12">
          <div className="space-y-6 md:col-span-5">
            <h2 id="product-heading" className="font-display text-3xl tracking-tight text-balance">
              {PRODUCT.heading.text}
            </h2>
            <p className="text-lg">{PRODUCT.what.text}</p>
            <h3 className="pt-4 text-xl font-semibold">{PRODUCT.problemHeading.text}</h3>
            <p className="max-w-[58ch] text-fg-muted">{PRODUCT.problem.text}</p>
          </div>
          <div className="space-y-6 md:col-span-7">
            <h3 className="text-xl font-semibold">{PRODUCT.howHeading.text}</h3>
            <ol className="[counter-reset:step]">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.title.id} className={COUNTER_ITEM}>
                  <p className="font-display text-lg">{step.title.text}</p>
                  <p className="max-w-[60ch] text-fg-muted">{step.text.text}</p>
                </li>
              ))}
            </ol>
            <p className="border-t border-border pt-5 font-display text-xl text-balance">
              {PRODUCT.guardrail.text}
            </p>
            <AccessLink variant="primary" size="lg" className="min-h-11">
              {PRODUCT.demoCta.text}
            </AccessLink>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">{PRODUCT.personasHeading.text}</h3>
          <PersonaGrid />
          <p className="max-w-[60ch] text-sm text-fg-muted">{PRODUCT.supportingRoles.text}</p>
        </div>
      </div>
    </section>
  );
}
