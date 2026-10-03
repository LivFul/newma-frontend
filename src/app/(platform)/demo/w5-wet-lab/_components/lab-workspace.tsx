"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { canAct } from "@/lib/demo/persona-actions";
import type { AssayImport, ElnEditResult, WorkPackage } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { ErrorNotice } from "../../_components/error-notice";
import { AcceptanceDialog } from "./acceptance-dialog";
import { ImportPanel } from "./import-panel";
import { RevisionNotice } from "./revision-notice";

type Props = Readonly<{
  workPackage: WorkPackage;
  candidateId: string;
  persona: PersonaId;
  onChanged?: () => void;
}>;

// The contract has no GET for an assay import: the import returned to the wet-lab POST is kept in
// client state (it survives the in-page persona switch) and in sessionStorage per work package.
const storageKey = (id: string) => `newma-demo:import:${id}`;

const isStoredImport = (value: unknown): value is AssayImport =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AssayImport).id === "string" &&
  typeof (value as AssayImport).status === "string" &&
  typeof (value as AssayImport).eln_revision === "number" &&
  Array.isArray((value as AssayImport).observation_ids);

const CHANGE_EVENT = "newma-demo:import-change";

function readRaw(id: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(id));
  } catch {
    return null;
  }
}

function writeRaw(id: string, value: AssayImport): void {
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(value));
  } catch {
    // Per-viewer convenience only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(notify: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, notify);
  return () => window.removeEventListener(CHANGE_EVENT, notify);
}

/** A stored import is only trusted while the ELN record has not moved past its revision. */
function parseStored(raw: string | null, elnRevision: number | undefined): AssayImport | undefined {
  if (raw === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredImport(parsed)) return undefined;
    return elnRevision !== undefined && parsed.eln_revision < elnRevision ? undefined : parsed;
  } catch {
    return undefined;
  }
}

export function LabWorkspace({ workPackage, candidateId, persona, onChanged }: Props) {
  const router = useRouter();
  // useSyncExternalStore: the server snapshot is null, so the first client render matches the
  // server HTML and the stored import appears right after hydration.
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(workPackage.id),
    () => null,
  );
  const current = useMemo(
    () => parseStored(raw, workPackage.eln?.revision),
    [raw, workPackage.eln?.revision],
  );
  const [revision, setRevision] = useState<number | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const changed = () => {
    onChanged?.();
    router.refresh();
  };
  const remember = (value: AssayImport) => {
    writeRaw(workPackage.id, value);
    changed();
  };

  const editEln = () => {
    const eln = workPackage.eln;
    if (pending || !eln) return;
    setError(undefined);
    startTransition(async () => {
      const result = await postJson<ElnEditResult>(
        `/api/demo/eln/records/${encodeURIComponent(eln.record_id)}/edit`,
        { change: "correct_value" },
      );
      if (!result.ok) return setError(result.error);
      setRevision(result.data.revision);
      changed();
    });
  };

  const accepted = current?.status === "accepted";
  return (
    <div className="space-y-4">
      <ImportPanel
        workPackage={workPackage}
        current={current}
        allowed={canAct(persona, "import_assay")}
        onImported={remember}
      />
      {current && !accepted && canAct(persona, "accept_import") ? (
        <AcceptanceDialog assayImport={current} onAccepted={remember} />
      ) : null}
      <div role="status" aria-live="polite" className="space-y-1 text-sm">
        {accepted ? (
          <>
            <p className="font-semibold">Accepted by NEWMA scientist</p>
            {current.gate_effect ? (
              <Link
                href={`/demo/w4-gates/${encodeURIComponent(candidateId)}`}
                className="underline underline-offset-4"
              >
                H2 is now decidable ({current.gate_effect.status_after}) — open W4
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
      {canAct(persona, "edit_eln_record") && workPackage.eln ? (
        <Button size="sm" variant="secondary" onClick={editEln} aria-busy={pending || undefined}>
          Edit Mock ELN record (correct a value)
        </Button>
      ) : null}
      {revision && revision > 1 ? <RevisionNotice revision={revision} /> : null}
      {current && current.eln_revision > 1 && current.status === "needs_review" ? (
        <RevisionNotice revision={current.eln_revision} />
      ) : null}
      <ErrorNotice error={error} />
    </div>
  );
}
