"use client";
import { useEffect, useMemo, useState } from "react";
import { canonicalJson } from "@/lib/provenance/canonical";
import { Sha256UnavailableError, sha256Hex } from "@/lib/provenance/sha256";

export type BrowserHash = Readonly<{
  /** The canonical string, or undefined when the manifest cannot be canonicalised. */
  canonical: string | undefined;
  canonicalError: string | undefined;
  sha256: string | undefined;
  /** Why no hash exists although the canonical string does (e.g. no crypto.subtle). */
  hashError: "unavailable" | "failed" | undefined;
}>;

type Settled = Readonly<{
  canonical: string;
  sha256?: string;
  hashError?: "unavailable" | "failed";
}>;

function canonicalise(manifest: unknown): { canonical?: string; error?: string } {
  try {
    return { canonical: canonicalJson(manifest) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown canonicalisation error." };
  }
}

/** Recomputes canonical JSON and SHA-256 in the browser whenever the shown manifest changes. */
export function useBrowserHash(manifest: unknown): BrowserHash {
  const { canonical, error } = useMemo(() => canonicalise(manifest), [manifest]);
  const [settled, setSettled] = useState<Settled | undefined>();

  useEffect(() => {
    if (canonical === undefined) return undefined;
    let live = true;
    sha256Hex(canonical)
      .then((sha256) => live && setSettled({ canonical, sha256 }))
      .catch((failure: unknown) => {
        if (!live) return;
        const hashError = failure instanceof Sha256UnavailableError ? "unavailable" : "failed";
        setSettled({ canonical, hashError });
      });
    return () => {
      live = false;
    };
  }, [canonical]);

  const current = settled?.canonical === canonical ? settled : undefined;
  return {
    canonical,
    canonicalError: error,
    sha256: current?.sha256,
    hashError: current?.hashError,
  };
}
