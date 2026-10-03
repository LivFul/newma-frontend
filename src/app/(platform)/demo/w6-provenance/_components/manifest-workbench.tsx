"use client";
import { useState } from "react";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { EventManifest, TamperResult, VerifyResult } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { SimulatedLabel } from "../../_components/simulated-label";
import { ManifestViewer } from "./manifest-viewer";
import { TamperToggle } from "./tamper-toggle";
import { useBrowserHash } from "./use-browser-hash";
import { VerifyPanel } from "./verify-panel";

// A verification result belongs to the manifest object it verified; it is shown only while that
// same manifest is on screen, so a stale "Valid" can never sit next to a tampered manifest.
type Verified = Readonly<{ result: VerifyResult; manifest: unknown }>;

export function ManifestWorkbench({ manifest: original }: { manifest: EventManifest }) {
  const [tampered, setTampered] = useState<TamperResult | undefined>();
  const [verified, setVerified] = useState<Verified | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  // One request at a time: Verify and the toggle are inert while any request is in flight.
  const { busy, run } = useAction();
  const shown: unknown = tampered?.manifest ?? original.manifest;
  const browser = useBrowserHash(shown);

  const verify = async (manifest: unknown) => {
    const response = await postJson<VerifyResult>("/api/demo/provenance/verify", {
      manifest,
      signature: original.signature,
      kid: original.kid,
    });
    if (!response.ok) return setError(response.error);
    setVerified({ result: response.data, manifest });
  };

  const toggle = (on: boolean) => {
    if (busy) return;
    void run(async () => {
      setVerified(undefined);
      setError(undefined);
      if (!on) {
        setTampered(undefined);
        return verify(original.manifest);
      }
      const response = await postJson<TamperResult>("/api/demo/provenance/tamper", {
        event_id: original.event_id,
      });
      if (!response.ok) return setError(response.error);
      setTampered(response.data);
    });
  };

  const onVerify = () => {
    if (busy) return;
    void run(async () => {
      setError(undefined);
      await verify(shown);
    });
  };

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap gap-2">
        <SimulatedLabel label="Demo signature, not production key" />
        <span className="text-sm text-fg-muted">Key id {original.kid}</span>
      </p>
      <TamperToggle checked={tampered !== undefined} busy={busy} onChange={toggle} />
      <ManifestViewer
        manifest={shown}
        canonical={tampered ? (browser.canonical ?? "") : original.canonical}
        serverSha256={original.sha256}
        browser={browser}
        compareWithServer={tampered ? undefined : original.canonical}
        tamperedPath={tampered?.tampered_path}
      />
      <VerifyPanel
        result={verified && verified.manifest === shown ? verified.result : undefined}
        error={error}
        busy={busy}
        onVerify={onVerify}
      />
    </div>
  );
}
