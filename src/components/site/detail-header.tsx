import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import type { EcosystemEntry } from "@/content/ecosystem/registry";
import { ComponentPlate } from "./component-plate";
import { RouteStack } from "./route-stack";

// The detail page's title block: the component's plate, its name, any callout (kept above the fold:
// the optional / off-chain claim must not sit below it), the summary and the proposal note.
export function DetailHeader({ entry }: { entry: EcosystemEntry }) {
  return (
    <header className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <ComponentPlate slug={entry.slug} className="w-28 md:w-36" />
        <RouteStack current={entry.slug} className="max-sm:hidden" />
      </div>
      <h1 className="font-display text-4xl leading-[1.0] font-medium tracking-[-0.035em] text-balance [overflow-wrap:anywhere] sm:text-5xl xl:text-6xl">
        {entry.title}
      </h1>
      {entry.callout ? (
        <p
          role="note"
          className="max-w-[44ch] rounded-xl border border-dashed border-eco-optional bg-bg-elevated px-4 py-3 text-lg leading-snug"
        >
          {entry.callout.text}
        </p>
      ) : null}
      <p className="max-w-[44ch] text-xl leading-snug">{entry.summary}</p>
      <p className="max-w-[52ch] text-sm leading-relaxed text-fg-muted">
        {DETAIL_COPY.proposed.text}
      </p>
    </header>
  );
}
