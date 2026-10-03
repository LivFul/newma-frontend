import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import { sourceLabel, type EcosystemEntry } from "@/content/ecosystem/registry";

export function SourcesList({ entry }: { entry: EcosystemEntry }) {
  return (
    <section aria-labelledby="sources-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="sources-heading" className="font-display text-2xl tracking-tight">
        {DETAIL_COPY.sourcesHeading.text}
      </h2>
      <ol role="list" className="mt-4 max-w-[62ch] list-decimal space-y-2 pl-6 text-fg-muted">
        {entry.sources.map((source) => (
          <li key={`${source.doc}-${source.section}`}>{sourceLabel(source)}</li>
        ))}
      </ol>
    </section>
  );
}
