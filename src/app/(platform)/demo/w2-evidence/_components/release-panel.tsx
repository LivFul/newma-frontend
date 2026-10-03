"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import type { Claim, CuratedRelease } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";

const isDefiniteRefusal = (status: number) => status >= 400 && status < 500;

/** Publishes every approved claim as one curated release; one key per release attempt. */
export function ReleasePanel({ claims, allowed }: { claims: readonly Claim[]; allowed: boolean }) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [release, setRelease] = useState<CuratedRelease | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();
  const approved = claims.filter((claim) => claim.status === "approved");

  const publish = () => {
    if (busy || !allowed || approved.length === 0) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson<CuratedRelease>("/api/demo/curation/releases", {
        claim_ids: approved.map((claim) => claim.id),
        idempotency_key: key,
      });
      if (!result.ok) {
        // A definite refusal committed nothing and the approved set may change before a retry;
        // after a network failure or 5xx the outcome is unknown, so the same key is kept.
        if (isDefiniteRefusal(result.status)) reset();
        return setError(result.error);
      }
      setRelease(result.data);
      reset();
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">
        {approved.length} approved claim{approved.length === 1 ? "" : "s"} ready for release.
      </p>
      <Button
        onClick={publish}
        aria-busy={busy || undefined}
        aria-disabled={!allowed || approved.length === 0 || undefined}
      >
        Publish curated release
      </Button>
      <ErrorNotice error={error} />
      <div role="status" aria-live="polite">
        {release ? (
          <p className="text-sm">
            Release version {release.version} published · manifest SHA-256{" "}
            <span className="break-all font-mono">{release.manifest_sha256}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
