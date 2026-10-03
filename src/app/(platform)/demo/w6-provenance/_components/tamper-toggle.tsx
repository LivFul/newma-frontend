"use client";

type Props = Readonly<{ checked: boolean; busy: boolean; onChange: (next: boolean) => void }>;

/** Demo-only control (A-P3-09): lives only under w6-provenance, never in production modules. */
export function TamperToggle({ checked, busy, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={busy || undefined}
        aria-label="Demo tamper toggle"
        onClick={() => !busy && onChange(!checked)}
        className="relative inline-flex h-8 w-14 items-center rounded-full border border-border-strong bg-bg-elevated aria-checked:bg-danger"
      >
        <span
          aria-hidden="true"
          className={`absolute h-6 w-6 rounded-full bg-fg transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
      <span className="text-sm">Tamper manifest (demo toggle){checked ? ": on" : ": off"}</span>
    </div>
  );
}
