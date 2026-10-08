"use client";

import { useTheme } from "@/lib/theme/use-theme";

/** Keeps `html` classes in sync on every route, including pages without the header menu. */
export function ThemeSync() {
  useTheme();
  return null;
}
