import type { ResolvedTheme, ThemePreference } from "./state";
import { resolveTheme } from "./state";
import { prefersDark, readPreference } from "./storage";

/** Applies manual override classes and color-scheme for the resolved appearance. */
export function applyTheme(preference: ThemePreference, resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", preference === "dark");
  root.classList.toggle("light", preference === "light");
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;
}

export function syncDomFromStorage(): void {
  const preference = readPreference();
  applyTheme(preference, resolveTheme(preference, prefersDark()));
}
