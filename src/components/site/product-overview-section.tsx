import { PRODUCT } from "@/content/home/copy";
import { AccessLink } from "./access-link";
import { PersonaGrid } from "./persona-grid";
import { CONTAINER, H2, H3_TITLE, SECTION, STATEMENT } from "./type";

type Props = Readonly<{ pageTitle?: boolean }>;

export function ProductOverviewSection({ pageTitle = false }: Props) {
  const Heading = pageTitle ? "h1" : "h2";
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className={`${SECTION} bg-bg-deep/40`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-(--space-20)`}>
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <Heading id="product-heading" className={H2}>
              {PRODUCT.heading.text}
            </Heading>
            <p className={`${STATEMENT} max-w-[44ch]`}>{PRODUCT.what.text}</p>
            <p className="max-w-[52ch] text-lg leading-relaxed text-fg-muted">
              {PRODUCT.whatDetail.text}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border/80 bg-bg-elevated p-6 shadow-sm lg:col-span-5 lg:mt-3">
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-cover bg-center opacity-30 [mask-image:linear-gradient(to_left,black_35%,transparent)]"
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
              <p className="max-w-[48ch] leading-relaxed text-fg-muted">
                {PRODUCT.problemDetail.text}
              </p>
              <p className="max-w-[48ch] leading-relaxed text-fg-muted">
                {PRODUCT.problemSolution.text}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className={H3_TITLE}>{PRODUCT.personasHeading.text}</h3>
          <PersonaGrid />
          <p className="max-w-[60ch] text-sm text-fg-muted">{PRODUCT.supportingRoles.text}</p>
        </div>

        <div className="flex justify-start border-t border-border pt-10 md:justify-end">
          <AccessLink variant="primary" size="lg" className="min-h-12">
            {PRODUCT.demoCta.text}
          </AccessLink>
        </div>
      </div>
    </section>
  );
}
