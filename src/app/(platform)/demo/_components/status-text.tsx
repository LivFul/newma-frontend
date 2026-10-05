import { Mark, type MarkKind } from "@/components/ui/mark";
import type { ExportStatus, LockState, ObligationStatus } from "@/lib/demo/types";

// Status in words plus a decorative symbol: meaning never rests on colour or shape alone.
type Entry = Readonly<{ symbol: MarkKind; text: string }>;

function StatusText({ entry }: { entry: Entry }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <Mark kind={entry.symbol} />
      <span>{entry.text}</span>
    </span>
  );
}

const EXPORT: Readonly<Record<ExportStatus, Entry>> = {
  active: { symbol: "dot", text: "Active" },
  expired: { symbol: "ring", text: "Expired" },
  suspended: { symbol: "triangle", text: "Suspended" },
};

const OBLIGATION: Readonly<Record<ObligationStatus, Entry>> = {
  fulfilled: { symbol: "check", text: "Done" },
  due: { symbol: "clock", text: "Due" },
  overdue: { symbol: "alert", text: "Late" },
};

const LOCK: Readonly<Record<LockState, Entry>> = {
  locked: { symbol: "square", text: "Locked" },
  open: { symbol: "square-open", text: "Open" },
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
