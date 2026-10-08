"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ResolvedTheme, ThemePreference } from "./state";
import { readPreference, readResolved, subscribe, writePreference } from "./storage";

const serverPreference = (): ThemePreference => "system";
const serverResolved = (): ResolvedTheme => "light";

export type UseThemePreference = Readonly<{
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (value: ThemePreference) => void;
}>;

/** Read and write the stored preference without touching the document (see ThemeSync). */
export function useThemePreference(): UseThemePreference {
  const preference = useSyncExternalStore(subscribe, readPreference, serverPreference);
  const resolved = useSyncExternalStore(subscribe, readResolved, serverResolved);
  const setPreference = useCallback((value: ThemePreference) => writePreference(value), []);
  return { preference, resolved, setPreference };
}
