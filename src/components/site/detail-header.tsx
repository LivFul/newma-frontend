import type { EcosystemEntry } from "@/content/ecosystem/registry";

export function DetailHeader({ entry }: { entry: EcosystemEntry }) {
  return (
    <header className="space-y-6">
      <h1 className="font-display text-display leading-[1.05] tracking-display text-balance">
        {entry.title}
      </h1>
      <p className="max-w-[62ch] text-lg">{entry.summary}</p>
      {entry.callout ? (
        <p
          role="note"
          className="max-w-[62ch] border border-dashed border-eco-optional px-4 py-3 font-display text-lg"
        >
          {entry.callout.text}
        </p>
      ) : null}
    </header>
  );
}
