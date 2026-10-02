"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { isRecord } from "@/lib/demo/guards";
import type { IngestionRun, SourceRecord } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";

type Reason = Readonly<{ code: string; message?: string }>;

function reasonsOf(error: ClientError): readonly Reason[] {
  if (!isRecord(error.details) || !Array.isArray(error.details.reasons)) return [];
  return error.details.reasons.filter(
    (r): r is Reason => isRecord(r) && typeof r.code === "string",
  );
}

function Rejected({ error }: { error: ClientError }) {
  return (
    <div role="alert" className="space-y-1 rounded-md border border-danger px-3 py-2 text-sm">
      <p className="font-medium">Rejected before ingestion</p>
      <ul>
        {reasonsOf(error).map((reason) => (
          <li key={reason.code}>
            <span className="font-mono">{reason.code}</span>
            {reason.message ? `: ${reason.message}` : null}
          </li>
        ))}
      </ul>
      <p>No claims were created.</p>
    </div>
  );
}

function SourceRow({ source }: { source: SourceRecord }) {
  const router = useRouter();
  const [error, setError] = useState<ClientError | undefined>();
  const [run, setRun] = useState<IngestionRun | undefined>();
  const [pending, startTransition] = useTransition();
  // One key per source row: a double click replays the same ingestion.
  const [key] = useState(() => crypto.randomUUID());

  const ingest = () => {
    if (pending) return;
    setError(undefined);
    startTransition(async () => {
      const result = await postJson<IngestionRun>("/api/demo/ingestion/runs", {
        source_record_id: source.id,
        idempotency_key: key,
      });
      if (!result.ok) return setError(result.error);
      setRun(result.data);
      router.refresh();
    });
  };

  return (
    <li className="space-y-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{source.title}</span>
        <Badge tone={source.clearance_status === "cleared" ? "success" : "warning"}>
          {source.clearance_status}
        </Badge>
        <Button
          size="sm"
          onClick={ingest}
          aria-busy={pending || undefined}
          aria-label={`Ingest ${source.title}`}
        >
          Ingest
        </Button>
      </div>
      {error?.code === "source_not_cleared" ? (
        <Rejected error={error} />
      ) : (
        <ErrorNotice error={error} />
      )}
      {run ? (
        <p role="status" className="text-sm">
          {run.claims.length} claim{run.claims.length === 1 ? "" : "s"} extracted into the curation
          queue.
        </p>
      ) : null}
    </li>
  );
}

export function IngestPanel({ sources }: { sources: readonly SourceRecord[] }) {
  return (
    <ul className="grid list-none gap-2 p-0" aria-label="Source records">
      {sources.map((source) => (
        <SourceRow key={source.id} source={source} />
      ))}
    </ul>
  );
}
