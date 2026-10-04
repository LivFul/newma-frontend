import type { ExportStatus, LockState, ObligationStatus } from "@/lib/demo/types";

// Status in words plus a decorative symbol: meaning never rests on colour or shape alone.
type Entry = Readonly<{ symbol: string; text: string }>;

function StatusText({ entry }: { entry: Entry }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <span aria-hidden="true">{entry.symbol}</span>
      <span>{entry.text}</span>
    </span>
  );
}

const EXPORT: Readonly<Record<ExportStatus, Entry>> = {
  active: { symbol: "●", text: "Active" },
  expired: { symbol: "○", text: "Expired" },
  suspended: { symbol: "▲", text: "Suspended" },
};

const OBLIGATION: Readonly<Record<ObligationStatus, Entry>> = {
  fulfilled: { symbol: "✓", text: "Done" },
  due: { symbol: "◷", text: "Due" },
  overdue: { symbol: "!", text: "Late" },
};

const LOCK: Readonly<Record<LockState, Entry>> = {
  locked: { symbol: "■", text: "Locked" },
  open: { symbol: "□", text: "Open" },
};

export const ExportStatusText = ({ status }: { status: ExportStatus }) => (
  <StatusText entry={EXPORT[status]} />
);
export const ObligationStatusText = ({ status }: { status: ObligationStatus }) => (
  <StatusText entry={OBLIGATION[status]} />
);
export const LockStateText = ({ state }: { state: LockState }) => (
  <StatusText entry={LOCK[state]} />
);
