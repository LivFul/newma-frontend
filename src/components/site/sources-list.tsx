import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import { sourceLabel, type EcosystemEntry } from "@/content/ecosystem/registry";

export function SourcesList({ entry }: { entry: EcosystemEntry }) {
  return (
    <section aria-labelledby="sources-heading" className="mt-14 border-t border-fg pt-6">
      <h2 id="sources-heading" className="text-2xl font-medium tracking-[-0.015em]">
        {DETAIL_COPY.sourcesHeading.text}
      </h2>
      <ol role="list" className="mt-5 max-w-[65ch] [counter-reset:ref]">
        {entry.sources.map((source) => (
          <li
            key={`${source.doc}-${source.section}`}
            className="grid grid-cols-[2.5rem_1fr] border-t border-fg/15 py-3 text-fg-muted [counter-increment:ref] before:font-mono before:text-xs before:leading-6 before:content-['['counter(ref)']']"
          >
            {sourceLabel(source)}
          </li>
        ))}
      </ol>
    </section>
  );
}
