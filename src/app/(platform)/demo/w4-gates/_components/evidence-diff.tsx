import type { EvidenceDiff } from "@/lib/demo/types";

const show = (value: unknown) => JSON.stringify(value);

function Section({ title, rows }: { title: string; rows: readonly string[] }) {
  if (rows.length === 0) return <p className="text-sm">{title}: none</p>;
  return (
    <div className="text-sm">
      <p className="font-medium">{title}</p>
      <ul className="list-disc pl-5 font-mono text-xs">
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}

export function EvidenceDiffView({ diff }: { diff: EvidenceDiff }) {
  return (
    <section
      aria-label={`Evidence diff v${diff.from_version} → v${diff.to_version}`}
      className="space-y-2"
    >
      <Section title="Added" rows={diff.added.map((d) => `${d.path}: ${show(d.value)}`)} />
      <Section title="Removed" rows={diff.removed.map((d) => `${d.path}: ${show(d.value)}`)} />
      <Section
        title="Changed"
        rows={diff.changed.map((d) => `${d.path}: ${show(d.before)} → ${show(d.after)}`)}
      />
    </section>
  );
}
