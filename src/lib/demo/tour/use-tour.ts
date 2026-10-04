"use client";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEMO_RESET_EVENT } from "./reset-event";
import {
  type DiscardReason,
  type TourState,
  parseState,
  resetTour,
  serializeState,
  startTour,
} from "./state";
import { readRaw, subscribe, writeRaw } from "./storage";

const serverSnapshot = (): null => null;

export type UseTour = Readonly<{
  /** The active tour for this tenant, or undefined (no tour, or a discarded value). */
  state: TourState | undefined;
  /** Why a stored value was ignored (another tenant or version, or malformed). */
  discarded: DiscardReason | undefined;
  start: () => void;
  update: (change: (state: TourState) => TourState) => void;
  end: () => void;
}>;

/** Tour progress over sessionStorage. Nothing renders from storage on the server. */
export function useTour(tenantId: string): UseTour {
  const raw = useSyncExternalStore(subscribe, readRaw, serverSnapshot);
  const parsed = useMemo(() => parseState(raw, tenantId), [raw, tenantId]);

  const start = useCallback(() => writeRaw(serializeState(startTour(tenantId))), [tenantId]);
  const end = useCallback(() => writeRaw(null), []);
  const update = useCallback(
    (change: (state: TourState) => TourState) => {
      const current = parseState(readRaw(), tenantId).state;
      if (current) writeRaw(serializeState(change(current)));
    },
    [tenantId],
  );

  useEffect(() => {
    const onReset = () => update((state) => resetTour(state));
    window.addEventListener(DEMO_RESET_EVENT, onReset);
    return () => window.removeEventListener(DEMO_RESET_EVENT, onReset);
  }, [update]);

  return { state: parsed.state, discarded: parsed.discarded, start, update, end };
}
