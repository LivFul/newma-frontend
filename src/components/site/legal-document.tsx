import type { LegalDocument } from "@/content/legal/types";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-display leading-[1.05] tracking-display text-balance">
        {doc.title.text}
      </h1>
      <p className="mt-6 max-w-[62ch] border border-dashed border-warning px-4 py-3 font-display text-lg">
        {doc.draftLabel.text}
      </p>
      {doc.sections.map((section) => (
        <section
          key={section.heading.id}
          aria-labelledby={section.heading.id}
          className="mt-10 border-t border-border pt-6"
        >
          <h2 id={section.heading.id} className="font-display text-2xl tracking-tight">
            {section.heading.text}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.id} className="mt-4 max-w-[62ch] text-fg-muted">
              {paragraph.text}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
