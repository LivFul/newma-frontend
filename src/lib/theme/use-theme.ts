"use client";

import type { UseThemePreference } from "./use-theme-preference";
import { useThemePreference } from "./use-theme-preference";

export type UseTheme = UseThemePreference;

/** @deprecated Prefer `useThemePreference` in UI and `useThemeApplicator` in ThemeSync. */
export function useTheme(): UseTheme {
  return useThemePreference();
}

export { useThemeApplicator } from "./use-theme-applicator";
export { useThemePreference } from "./use-theme-preference";
export { resolveTheme, type ThemePreference, type ResolvedTheme } from "./state";
export { prefersDark, readPreference } from "./storage";
