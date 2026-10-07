import { CLOSING } from "@/content/home/copy";
import { AccessLink } from "./access-link";
import { CONTAINER, H2, SECTION } from "./type";

export function ClosingSection() {
  return (
    <section
      id="closing"
      aria-labelledby="closing-heading"
      className={`${SECTION} plate-surface`}
      data-reveal
    >
      <div
        className={`${CONTAINER} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}
      >
        <div className="space-y-4">
          <h2 id="closing-heading" className={H2}>
            {CLOSING.heading.text}
          </h2>
          <p className="max-w-[52ch] text-lg leading-relaxed text-plate-muted">
            {CLOSING.body.text}
          </p>
        </div>
        <AccessLink variant="primary" size="lg" className="min-h-12 self-start md:self-auto">
          {CLOSING.demoCta.text}
        </AccessLink>
      </div>
    </section>
  );
}
