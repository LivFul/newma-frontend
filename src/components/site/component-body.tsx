import { DETAIL_COPY } from "@/content/ecosystem/detail-copy";
import type { EcosystemEntry } from "@/content/ecosystem/registry";

export function ComponentBody({ entry }: { entry: EcosystemEntry }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="description-heading">
        <h2 id="description-heading" className="sr-only">
          {DETAIL_COPY.descriptionHeading.text}
        </h2>
        <p className="max-w-[52ch] text-xl leading-snug">{entry.summary}</p>
        {entry.summaryDetail ? (
          <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-fg-muted">
            {entry.summaryDetail}
          </p>
        ) : null}
      </section>
      <section aria-labelledby="functions-heading">
        <h2 id="functions-heading" className="text-2xl font-medium tracking-[-0.015em]">
          {DETAIL_COPY.functionsHeading.text}
        </h2>
        <ul role="list" className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-fg-muted">
          {entry.designedFunctions.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="handoff-heading">
        <h2 id="handoff-heading" className="text-2xl font-medium tracking-[-0.015em]">
          {DETAIL_COPY.handoffHeading.text}
        </h2>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-fg-muted">
          {entry.handoff.text}
        </p>
      </section>
    </div>
  );
}
