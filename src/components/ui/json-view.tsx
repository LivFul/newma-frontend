import { useId } from "react";

export type JsonViewProps = Readonly<{
  value: unknown;
  label: string;
  /** Dot path of a field to call out (e.g. the tampered field). */
  highlightPath?: string;
}>;

/** Index of the line holding the last segment of a dot path, walking segment by segment. */
export function lineOfPath(lines: readonly string[], path: string): number | undefined {
  const segments = path
    .split(".")
    .map((segment) => segment.replace(/\[\d+\]/g, ""))
    .filter(Boolean);
  let from = 0;
  let found: number | undefined;
  for (const segment of segments) {
    const index = lines.findIndex(
      (line, i) => i >= from && line.trimStart().startsWith(`"${segment}":`),
    );
    if (index === -1) return found;
    found = index;
    from = index;
  }
  return found;
}

/** Read-only pretty-printed JSON in a labelled, keyboard-scrollable region. */
export function JsonView({ value, label, highlightPath }: JsonViewProps) {
  const id = useId();
  const lines = JSON.stringify(value, null, 2).split("\n");
  const marked = highlightPath ? lineOfPath(lines, highlightPath) : undefined;
  return (
    <section role="region" aria-labelledby={id} className="space-y-1">
      <h3 id={id} className="text-sm font-medium">
        {label}
      </h3>
      {highlightPath ? <p className="text-sm text-danger">Altered field: {highlightPath}</p> : null}
      <pre
        tabIndex={0}
        className="max-h-80 overflow-auto rounded-md border border-border bg-bg-elevated p-3 text-xs"
      >
        {lines.map((line, index) => (
          <span key={index}>
            {index === marked ? <mark className="bg-danger text-danger-fg">{line}</mark> : line}
            {index < lines.length - 1 ? "\n" : ""}
          </span>
        ))}
      </pre>
    </section>
  );
}
