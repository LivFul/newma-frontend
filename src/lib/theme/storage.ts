import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  parsePreference,
  resolveTheme,
  type ThemePreference,
} from "./state";

let memory: ThemePreference | null = null;
let memoryAuthoritative = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readPreference(): ThemePreference {
  if (memoryAuthoritative && memory !== null) return memory;
  try {
    return parsePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return memory ?? DEFAULT_THEME_PREFERENCE;
  }
}

export function readResolved(): ReturnType<typeof resolveTheme> {
  return resolveTheme(readPreference(), prefersDark());
}

export function writePreference(value: ThemePreference): void {
  memory = value;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    memoryAuthoritative = false;
  } catch {
    memoryAuthoritative = true;
  }
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) listener();
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => listener();
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", onScheme);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", onScheme);
  };
}
