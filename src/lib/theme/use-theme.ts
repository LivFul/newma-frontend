"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { applyTheme } from "./dom";
import type { ResolvedTheme, ThemePreference } from "./state";
import { resolveTheme } from "./state";
import {
  prefersDark,
  readPreference,
  readResolved,
  subscribe,
  writePreference,
} from "./storage";

const serverPreference = (): ThemePreference => "system";
const serverResolved = (): ResolvedTheme => "light";

export type UseTheme = Readonly<{
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (value: ThemePreference) => void;
}>;

/** Colour-scheme preference from localStorage, resolved against OS when set to system. */
export function useTheme(): UseTheme {
  const preference = useSyncExternalStore(subscribe, readPreference, serverPreference);
  const resolved = useSyncExternalStore(subscribe, readResolved, serverResolved);

  useEffect(() => {
    applyTheme(preference, resolved);
  }, [preference, resolved]);

  const setPreference = useCallback((value: ThemePreference) => writePreference(value), []);

  return { preference, resolved, setPreference };
}

/** For tests and the inline bootstrap script: resolve without subscribing. */
export { resolveTheme, prefersDark, readPreference };
