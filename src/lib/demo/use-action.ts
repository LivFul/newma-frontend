"use client";
import { useCallback, useRef, useState } from "react";

// One in-flight action at a time, with `busy` covering only the action itself. Unlike
// startTransition, a router.refresh() issued inside the action does not keep `busy` true, so a
// quick second click after the result is never silently dropped.
export type Action = Readonly<{ busy: boolean; run: (fn: () => Promise<void>) => Promise<void> }>;

export function useAction(): Action {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = useCallback(async (fn: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      // Actions report failures through their own state; this only keeps the rejection handled.
      console.error("demo action failed", error);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
