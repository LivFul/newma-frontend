"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme } from "./dom";
import type { ResolvedTheme, ThemePreference } from "./state";
import { readPreference, readResolved, subscribe } from "./storage";

const serverPreference = (): ThemePreference => "system";
const serverResolved = (): ResolvedTheme => "light";

/** Subscribes to preference storage and mirrors it onto `html` (mount once per document). */
export function useThemeApplicator(): void {
  const preference = useSyncExternalStore(subscribe, readPreference, serverPreference);
  const resolved = useSyncExternalStore(subscribe, readResolved, serverResolved);
  useEffect(() => {
    applyTheme(preference, resolved);
  }, [preference, resolved]);
}
