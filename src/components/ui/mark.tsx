// Drawn status marks. Functional kinds (check, cross, alert, pause) carry meaning in the demo;
// decorative dots and squares are retained only as last-resort fallbacks.
export type MarkKind =
  | "check"
  | "cross"
  | "dot"
  | "ring"
  | "half"
  | "pause"
  | "triangle"
  | "clock"
  | "alert"
  | "square"
  | "square-open"
  | "arrow";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;

function shape(kind: MarkKind) {
  switch (kind) {
    case "check":
      return <path d="M3 8.5l3.25 3.25L13 4.5" {...STROKE} />;
    case "cross":
      return <path d="M4 4l8 8M12 4l-8 8" {...STROKE} />;
    case "dot":
      return <circle cx="8" cy="8" r="4.5" fill="currentColor" />;
    case "ring":
      return <circle cx="8" cy="8" r="4.5" {...STROKE} />;
    case "half":
      return (
        <>
          <circle cx="8" cy="8" r="4.5" {...STROKE} />
          <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
        </>
      );
    case "pause":
      return <path d="M6 3.5v9M10 3.5v9" {...STROKE} />;
    case "triangle":
      return <path d="M8 3l5.5 9.5h-11z" {...STROKE} strokeLinejoin="round" />;
    case "clock":
      return (
        <>
          <circle cx="8" cy="8" r="5.5" {...STROKE} />
          <path d="M8 5v3.25l2.25 1.5" {...STROKE} />
        </>
      );
    case "alert":
      return (
        <>
          <path d="M8 3v6.5" {...STROKE} />
          <circle cx="8" cy="12.5" r="1" fill="currentColor" />
        </>
      );
    case "square":
      return <rect x="3.5" y="3.5" width="9" height="9" fill="currentColor" />;
    case "square-open":
      return <rect x="3.5" y="3.5" width="9" height="9" {...STROKE} />;
    case "arrow":
      return <path d="M2.5 8h10M9 4.5L12.5 8 9 11.5" {...STROKE} />;
  }
}

export function Mark({ kind, className = "size-3.5" }: { kind: MarkKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`inline-block shrink-0 align-[-0.125em] ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {shape(kind)}
    </svg>
  );
}
