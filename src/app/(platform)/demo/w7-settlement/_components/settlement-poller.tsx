"use client";
import type { Settlement } from "@/lib/demo/types";
import { useSettlementPolling } from "@/lib/demo/use-settlement-polling";
import { AnchorPanel } from "./anchor-panel";

/** Anchoring status; polls only while the anchor is pending and never blocks another control. */
export function SettlementPoller({ settlement }: { settlement: Settlement }) {
  const live = useSettlementPolling(settlement);
  return <AnchorPanel anchor={live.anchor} audited={settlement.state === "audited"} />;
}
