"use client";

import { useThemeApplicator } from "@/lib/theme/use-theme-applicator";

/** Keeps `html` classes in sync on every route, including pages without the header menu. */
export function ThemeSync() {
  useThemeApplicator();
  return null;
}
