import type { LegalDocument } from "@/content/legal/types";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="px-5 py-10 md:px-12 md:py-14">
      <div className="grid w-full gap-x-16 gap-y-10 lg:grid-cols-12">
        <header className="space-y-6 lg:col-span-5 lg:self-start lg:[@media(min-height:56rem)]:sticky lg:[@media(min-height:56rem)]:top-[calc(var(--size-header)+2.5rem)]">
          <h1 className="font-display text-4xl leading-[1.0] font-medium tracking-[-0.035em] text-balance [overflow-wrap:anywhere] sm:text-5xl xl:text-6xl">
            {doc.title.text}
          </h1>
          <p className="max-w-[36ch] rounded-lg border border-warning-ink bg-warning/20 px-4 py-3 text-lg leading-snug">
            <span>{doc.draftLabel.text}</span>
          </p>
        </header>
        <div className="lg:col-span-7 lg:border-l lg:border-border lg:pl-16">
          {doc.sections.map((section) => (
            <section
              key={section.heading.id}
              aria-labelledby={section.heading.id}
              className="border-t border-border pt-6 not-first:mt-12"
            >
              <h2 id={section.heading.id} className="text-2xl font-medium tracking-[-0.015em]">
                {section.heading.text}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.id}
                  className="mt-4 max-w-[65ch] text-lg leading-relaxed text-fg-muted"
                >
                  {paragraph.text}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
