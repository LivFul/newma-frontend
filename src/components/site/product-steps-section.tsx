import { HOW_IT_WORKS } from "@/content/home/how-it-works";
import { PRODUCT } from "@/content/home/copy";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { AccessLink } from "./access-link";
import { CONTAINER, H2, H3_TITLE, REVEAL_CHILD, SECTION, STATEMENT } from "./type";

const WAYPOINT =
  "relative grid content-start gap-3 pl-16 lg:pl-0 lg:pt-16 " + "[counter-increment:step]";

type Props = Readonly<{ pageTitle?: boolean }>;

export function ProductStepsSection({ pageTitle = false }: Props) {
  const Heading = pageTitle ? "h1" : "h3";
  const headingClass = pageTitle ? H2 : H3_TITLE;
  return (
    <section
      id="steps"
      aria-labelledby="steps-heading"
      className={`${SECTION} bg-bg-deep/40`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-(--space-10)`}>
        <Heading id="steps-heading" className={headingClass}>
          {PRODUCT.howHeading.text}
        </Heading>
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute top-5 bottom-0 left-6 w-px bg-brand lg:top-[1.125rem] lg:right-8 lg:bottom-auto lg:left-8 lg:h-px lg:w-auto"
          />
          <ol
            role="list"
            className="relative grid gap-(--space-12) [counter-reset:step] lg:grid-cols-4 lg:gap-(--space-10)"
          >
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title.id} className={`${WAYPOINT} ${REVEAL_CHILD}`}>
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 grid h-9 place-items-center lg:left-1/2 lg:-translate-x-1/2"
                >
                  <PillIcon fit="shape" className="h-9 w-auto" />
                  <span className="absolute font-mono text-[0.65rem] text-accent-fg">
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
    </section>
  );
}
