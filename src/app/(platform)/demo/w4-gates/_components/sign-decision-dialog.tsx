"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { Gate, GateDecision, GateDecisionValue } from "@/lib/demo/types";
import { SelectField, TextField } from "../../_components/fields";
import { GateErrorNotice } from "./missing-requirements";

type Props = Readonly<{
  gate: Gate;
  candidateDisplayId: string;
  versions: readonly number[];
  allowed: boolean;
  onSigned: (decision: GateDecision, replayed: boolean) => void;
}>;

const DECISIONS = ["pass", "fail", "hold"] as const satisfies readonly GateDecisionValue[];

type Draft = Readonly<{
  decision: GateDecisionValue;
  rationale: string;
  version: string;
  typed: string;
}>;

const emptyDraft = (versions: readonly number[]): Draft => ({
  decision: "pass",
  rationale: "",
  version: String(versions.at(-1) ?? 1),
  typed: "",
});

/**
 * Step-up signed decision (A-P3-07). One idempotency key per open: every submit while the dialog is
 * open reuses it, so a double click or retry is a replay, never a second decision (Review Focus 2).
 */
export function SignDecisionDialog({
  gate,
  candidateDisplayId,
  versions,
  allowed,
  onSigned,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(versions));
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();
  const name = `Sign ${gate.stage} decision`;
  const matches = draft.typed.trim() === candidateDisplayId;
  const set = (patch: Partial<Draft>) => setDraft((previous) => ({ ...previous, ...patch }));

  if (!allowed) {
    return (
      <Button size="sm" variant="secondary" aria-disabled="true">
        {name}
      </Button>
    );
  }

  // While a decision is in flight the dialog cannot close (and so cannot re-open with a new key).
  const onOpenChange = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    setError(undefined);
    if (next) {
      setKey(crypto.randomUUID());
      setDraft(emptyDraft(versions));
    }
  };

  const submit = () => {
    if (pending || !matches) return;
    setError(undefined);
    startTransition(async () => {
      const result = await postJson<GateDecision>(
        `/api/demo/gates/${encodeURIComponent(gate.id)}/decisions`,
        {
          decision: draft.decision,
          rationale: draft.rationale,
          evidence_package_version: Number(draft.version),
          confirm_candidate_display_id: draft.typed.trim(),
          idempotency_key: key,
        },
      );
      if (!result.ok) {
        // A definite 4xx refusal committed nothing: an edited retry is a new request.
        if (result.status >= 400 && result.status < 500) setKey(crypto.randomUUID());
        return setError(result.error);
      }
      onSigned(result.data, result.replayed);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">{name}</Button>
      </DialogTrigger>
      <DialogContent
        title={`Sign ${gate.stage} decision`}
        description="Demo sign-in step-up confirms the signer. Demo signature, not production key."
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Decision</legend>
            {DECISIONS.map((value) => (
              <label key={value} className="mr-4 inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="decision"
                  value={value}
                  checked={draft.decision === value}
                  onChange={() => set({ decision: value })}
                />
                {value}
              </label>
            ))}
          </fieldset>
          <TextField
            label="Rationale"
            value={draft.rationale}
            onChange={(rationale) => set({ rationale })}
            multiline
          />
          <SelectField
            label="Evidence-package version"
            value={draft.version}
            onChange={(version) => set({ version })}
            options={versions.map((v) => ({ value: String(v), label: `v${v}` }))}
          />
          <TextField
            label={`Demo sign-in step-up: type the candidate id ${candidateDisplayId} to confirm`}
            value={draft.typed}
            onChange={(typed) => set({ typed })}
          />
          <GateErrorNotice error={error} />
          <Button
            type="submit"
            aria-busy={pending || undefined}
            aria-disabled={!matches || undefined}
          >
            Sign decision
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
