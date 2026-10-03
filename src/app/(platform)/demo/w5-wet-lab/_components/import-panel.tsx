"use client";
import { useState, useTransition } from "react";
import { Badge, Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { AssayImport, WorkPackage } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { humanize } from "../../_components/fields";

type Props = Readonly<{
  workPackage: WorkPackage;
  current: AssayImport | undefined;
  allowed: boolean;
  onImported: (assayImport: AssayImport) => void;
}>;

/** Wet-lab/CRO imports Mock ELN results; a repeat is a duplicate with zero new observations. */
export function ImportPanel({ workPackage, current, allowed, onImported }: Props) {
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const eln = workPackage.eln;

  const importResults = () => {
    if (pending || !eln || !allowed) return;
    setError(undefined);
    startTransition(async () => {
      const result = await postJson<AssayImport>("/api/demo/assay-imports", {
        work_package_id: workPackage.id,
        eln_record_id: eln.record_id,
      });
      if (!result.ok) return setError(result.error);
      onImported(result.data);
    });
  };

  return (
    <div className="space-y-2 text-sm">
      {allowed ? (
        <Button
          onClick={importResults}
          aria-busy={pending || undefined}
          aria-disabled={!eln || undefined}
        >
          Import results
        </Button>
      ) : null}
      <ErrorNotice error={error} />
      <div role="status" aria-live="polite" className="space-y-1">
        {current?.duplicate ? (
          <p className="font-semibold">Duplicate import — no new observations</p>
        ) : null}
        {current ? (
          <>
            <p className="flex flex-wrap items-center gap-2">
              Import <Badge>{humanize(current.status)}</Badge> · ELN revision {current.eln_revision}
            </p>
            <p data-testid="observation-count">{current.observation_ids.length} observations</p>
            <p className="break-all font-mono text-xs">checksum {current.checksum_sha256}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
