"use client";
import type { Settlement } from "./types";
import { usePolling } from "./use-polling";

// The settlement page polls the one settlement route (2000 ms) only while an anchor is pending;
// it stops when the anchor settles, is not requested, or the component unmounts (Review Focus 5).
const anchorSettled = (settlement: Settlement): boolean => settlement.anchor.status !== "pending";

export function useSettlementPolling(initial: Settlement): Settlement {
  const url =
    initial.anchor.status === "pending"
      ? `/api/demo/settlements/${encodeURIComponent(initial.id)}`
      : undefined;
  const { data } = usePolling<Settlement>(url, anchorSettled);
  return url !== undefined && data ? data : initial;
}
