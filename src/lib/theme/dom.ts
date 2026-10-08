import { BACKGROUND_HEX, BRAND_HEX } from "@/lib/brand";
import type { ResolvedTheme, ThemePreference } from "./state";
import { resolveTheme } from "./state";
import { prefersDark, readPreference } from "./storage";

export const THEME_COLOR_META_ID = "newma-theme-color";

/** Keeps the browser chrome aligned with the resolved survey-paper stack (overrides media-based defaults). */
export function syncThemeColorMeta(resolved: ResolvedTheme): void {
  const content = resolved === "dark" ? BRAND_HEX.night : BACKGROUND_HEX;
  let meta = document.getElementById(THEME_COLOR_META_ID) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.id = THEME_COLOR_META_ID;
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/** Applies manual override classes and color-scheme for the resolved appearance. */
export function applyTheme(preference: ThemePreference, resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", preference === "dark");
  root.classList.toggle("light", preference === "light");
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;
  syncThemeColorMeta(resolved);
}

export function syncDomFromStorage(): void {
  const preference = readPreference();
  applyTheme(preference, resolveTheme(preference, prefersDark()));
}
