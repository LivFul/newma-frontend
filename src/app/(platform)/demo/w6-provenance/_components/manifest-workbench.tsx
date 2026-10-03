"use client";
import { useEffect, useState, useTransition } from "react";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { EventManifest, TamperResult, VerifyResult } from "@/lib/demo/types";
import { canonicalJson } from "@/lib/provenance/canonical";
import { sha256Hex } from "@/lib/provenance/sha256";
import { SimulatedLabel } from "../../_components/simulated-label";
import { ManifestViewer } from "./manifest-viewer";
import { TamperToggle } from "./tamper-toggle";
import { VerifyPanel } from "./verify-panel";

type Hashed = Readonly<{ canonical: string; sha256: string | undefined }>;

function safeCanonical(value: unknown): string {
  try {
    return canonicalJson(value);
  } catch {
    return "";
  }
}

/** Recomputes canonical JSON and SHA-256 in the browser whenever the shown manifest changes. */
function useBrowserHash(manifest: unknown): Hashed {
  const canonical = safeCanonical(manifest);
  const [hashed, setHashed] = useState<Hashed>({ canonical, sha256: undefined });
  useEffect(() => {
    let live = true;
    void sha256Hex(canonical).then((sha256) => live && setHashed({ canonical, sha256 }));
    return () => {
      live = false;
    };
  }, [canonical]);
  return hashed.canonical === canonical ? hashed : { canonical, sha256: undefined };
}

export function ManifestWorkbench({ manifest: original }: { manifest: EventManifest }) {
  const [tampered, setTampered] = useState<TamperResult | undefined>();
  const [result, setResult] = useState<VerifyResult | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const shown = tampered?.manifest ?? original.manifest;
  const browser = useBrowserHash(shown);

  const verify = (manifest: unknown) => {
    setError(undefined);
    startTransition(async () => {
      const response = await postJson<VerifyResult>("/api/demo/provenance/verify", {
        manifest,
        signature: original.signature,
        kid: original.kid,
      });
      if (!response.ok) return setError(response.error);
      setResult(response.data);
    });
  };

  const toggle = (on: boolean) => {
    setResult(undefined);
    setError(undefined);
    if (!on) {
      setTampered(undefined);
      verify(original.manifest);
      return;
    }
    startTransition(async () => {
      const response = await postJson<TamperResult>("/api/demo/provenance/tamper", {
        event_id: original.event_id,
      });
      if (!response.ok) return setError(response.error);
      setTampered(response.data);
    });
  };

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap gap-2">
        <SimulatedLabel label="Demo signature, not production key" />
        <span className="text-sm text-fg-muted">Key id {original.kid}</span>
      </p>
      <TamperToggle checked={tampered !== undefined} busy={pending} onChange={toggle} />
      <ManifestViewer
        manifest={shown}
        canonical={tampered ? browser.canonical : original.canonical}
        serverSha256={original.sha256}
        browserSha256={browser.sha256}
        canonicalMatchesServer={tampered ? undefined : browser.canonical === original.canonical}
        tamperedPath={tampered?.tampered_path}
      />
      <VerifyPanel result={result} error={error} busy={pending} onVerify={() => verify(shown)} />
    </div>
  );
}
