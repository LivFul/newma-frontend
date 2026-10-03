"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

function readStored(id: string): AssayImport | undefined {
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as AssayImport) : undefined;
  } catch {
    return undefined;
  }
}

function store(id: string, value: AssayImport): void {
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(value));
  } catch {
    // Per-viewer convenience only.
  }
}

export function LabWorkspace({ workPackage, candidateId, persona, onChanged }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState<AssayImport | undefined>(() => readStored(workPackage.id));
  const [revision, setRevision] = useState<number | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const changed = () => {
    onChanged?.();
    router.refresh();
  };
  const remember = (value: AssayImport) => {
    setCurrent(value);
    store(workPackage.id, value);
    changed();
  };

  const editEln = () => {
    const eln = workPackage.eln;
    if (pending || !eln) return;
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
      {accepted ? (
        <div role="status" className="space-y-1 text-sm">
          <p className="font-semibold">Accepted by NEWMA scientist</p>
          {current.gate_effect ? (
            <Link
              href={`/demo/w4-gates/${encodeURIComponent(candidateId)}`}
              className="underline underline-offset-4"
            >
              H2 is now decidable ({current.gate_effect.status_after}) — open W4
            </Link>
          ) : null}
        </div>
      ) : null}
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
