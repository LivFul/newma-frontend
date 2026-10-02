"use client";
import { useCallback, useState } from "react";

// One idempotency key per mounted form: every submit (double click, retry after a timeout) reuses
// it, so the backend answers a replay instead of creating a second record (Review Focus 2).
export type StableKey = Readonly<{ key: string; reset: () => void }>;

export function useStableKey(): StableKey {
  const [key, setKey] = useState(() => crypto.randomUUID());
  const reset = useCallback(() => setKey(crypto.randomUUID()), []);
  return { key, reset };
}
