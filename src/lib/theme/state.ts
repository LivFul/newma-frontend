export const THEME_STORAGE_KEY = "newma.theme.v1";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const PREFERENCES = new Set<ThemePreference>(["light", "dark", "system"]);

export function parsePreference(raw: string | null): ThemePreference {
  if (raw && PREFERENCES.has(raw as ThemePreference)) return raw as ThemePreference;
  return "system";
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return prefersDark ? "dark" : "light";
}

export function bootstrapFromStorage(
  raw: string | null,
  prefersDark: boolean,
): { preference: ThemePreference; resolved: ResolvedTheme } {
  const preference = parsePreference(raw);
  const resolved = resolveTheme(preference, prefersDark);
  return { preference, resolved };
}
