import { HOW_IT_WORKS } from "@/content/home/how-it-works";
import { PRODUCT } from "@/content/home/copy";
import { AccessLink } from "./access-link";
import { BenchmarkMark } from "./benchmark-mark";
import { PersonaGrid } from "./persona-grid";
import { CONTAINER, H2, H3_TITLE, SECTION, STATEMENT } from "./type";

// The four steps read as a route profile: waypoints strung along the apricot farm-to-patient line,
// numbered because the order carries meaning.
const WAYPOINT =
  "relative grid content-start gap-3 pl-12 [counter-increment:step] lg:pl-0 lg:pt-14 " +
  "before:absolute before:left-0 before:top-0 before:grid before:size-9 before:place-items-center " +
  "before:rounded-full before:border before:border-fg before:bg-bg before:font-mono before:text-xs " +
  "before:content-[counter(step,decimal-leading-zero)]";

export function ProductIntro() {
  return (
    <section id="product" aria-labelledby="product-heading" className={SECTION}>
      <div className={`${CONTAINER} space-y-24`}>
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <h2 id="product-heading" className={H2}>
              {PRODUCT.heading.text}
            </h2>
            <p className={`${STATEMENT} max-w-[30ch]`}>{PRODUCT.what.text}</p>
          </div>
          <div className="space-y-4 border-t border-fg pt-6 lg:col-span-5 lg:mt-3">
            <h3 className={H3_TITLE}>{PRODUCT.problemHeading.text}</h3>
            <p className="max-w-[48ch] text-lg leading-relaxed text-fg-muted">
              {PRODUCT.problem.text}
            </p>
          </div>
        </div>

        <div className="space-y-10">
          <h3 className={H3_TITLE}>{PRODUCT.howHeading.text}</h3>
          <div className="relative">
            {/* The route line the waypoints sit on: vertical on phones, horizontal from lg. */}
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-[1.125rem] w-[7px] -translate-x-1/2 border-x-2 border-route-edge bg-route lg:top-[1.125rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-[7px] lg:w-auto lg:translate-x-0 lg:-translate-y-1/2 lg:border-x-0 lg:border-y-2"
            />
            <ol
              role="list"
              className="relative grid gap-12 [counter-reset:step] lg:grid-cols-4 lg:gap-10"
            >
              {HOW_IT_WORKS.map((step) => (
                <li key={step.title.id} className={WAYPOINT}>
                  <p className="text-xl font-medium tracking-[-0.01em]">{step.title.text}</p>
                  <p className="max-w-[38ch] leading-relaxed text-fg-muted">{step.text.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-8 border-t border-fg pt-10 md:flex-row md:items-center md:justify-between">
            <p className={`${STATEMENT} flex max-w-[34ch] items-start gap-4`}>
              <BenchmarkMark className="mt-1.5 size-8 shrink-0" />
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
