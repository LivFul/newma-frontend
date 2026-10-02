import { useId } from "react";

export type JsonViewProps = Readonly<{
  value: unknown;
  label: string;
  /** Dot path of a field to call out (e.g. the tampered field). */
  highlightPath?: string;
}>;

/** Read-only pretty-printed JSON in a labelled, keyboard-scrollable region. */
export function JsonView({ value, label, highlightPath }: JsonViewProps) {
  const id = useId();
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
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}
