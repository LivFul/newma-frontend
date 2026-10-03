import { TOUR_STORAGE_KEY } from "./state";

// sessionStorage with an in-memory fallback: storage can be missing, blocked or full (private
// windows, site-data settings, quota). Every access is guarded, so the tour keeps working for the
// page's lifetime and never throws. Values never leave the browser.
let memory: string | null = null;
// True while the last write did not reach storage: memory is then the truth, not storage.
let memoryAuthoritative = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function readRaw(): string | null {
  if (memoryAuthoritative) return memory;
  try {
    return window.sessionStorage.getItem(TOUR_STORAGE_KEY);
  } catch {
    return memory;
  }
}

export function writeRaw(value: string | null): void {
  memory = value;
  try {
    if (value === null) window.sessionStorage.removeItem(TOUR_STORAGE_KEY);
    else window.sessionStorage.setItem(TOUR_STORAGE_KEY, value);
    memoryAuthoritative = false;
  } catch {
    memoryAuthoritative = true;
  }
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOUR_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
