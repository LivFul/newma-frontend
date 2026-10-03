"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useAction } from "@/lib/demo/use-action";
import { useStableKey } from "@/lib/demo/idempotency";
import type { Candidate, MaterialBatch, WorkPackage, WorkPackageProposal } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, TextField } from "../../_components/fields";

type Props = Readonly<{
  candidates: readonly Candidate[];
  batches: readonly MaterialBatch[];
  proposal: WorkPackageProposal | undefined;
  allowed: boolean;
}>;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value ? value : fallback;
const list = (value: unknown, fallback: string) =>
  Array.isArray(value) ? value.join(", ") : fallback;
const split = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

function defaultBatch(
  candidates: readonly Candidate[],
  batches: readonly MaterialBatch[],
  p: WorkPackageProposal | undefined,
): string {
  const candidateId = text(p?.candidate_id, candidates[0]?.id ?? "");
  const compound = candidates.find((c) => c.id === candidateId)?.compound_id;
  return (batches.find((b) => b.compound_id === compound) ?? batches[0])?.id ?? "";
}

function initialDraft(
  candidates: readonly Candidate[],
  batches: readonly MaterialBatch[],
  p: WorkPackageProposal | undefined,
) {
  return {
    candidate_id: text(p?.candidate_id, candidates[0]?.id ?? ""),
    material_batch_id: text(p?.material_batch_id, defaultBatch(candidates, batches, p)),
    hypothesis: text(
      p?.hypothesis,
      "The synthetic candidate shows concentration-dependent activity.",
    ),
    assay_endpoint: text(p?.assay_endpoint, "IC50"),
    protocol_version: text(p?.protocol_version, "v1-synthetic"),
    controls: list(p?.controls, "vehicle, reference compound"),
    concentrations_um: list(p?.concentrations_um, "0.1, 1, 10"),
    replicates: String(typeof p?.replicates === "number" ? p.replicates : 3),
    deliverables: list(p?.deliverables, "dose-response curve"),
    scenario: "standard",
  };
}

type Draft = ReturnType<typeof initialDraft>;

const toBody = (d: Draft, key: string) => ({
  ...d,
  controls: split(d.controls),
  concentrations_um: split(d.concentrations_um).map(Number),
  replicates: Number(d.replicates),
  deliverables: split(d.deliverables),
  idempotency_key: key,
});

export function WorkPackageForm({ candidates, batches, proposal, allowed }: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(candidates, batches, proposal));
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();
  const set = (field: keyof Draft) => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));
  const compoundOf = (candidateId: string) =>
    candidates.find((c) => c.id === candidateId)?.compound_id;
  const batchesFor = (candidateId: string) => {
    const own = batches.filter((b) => b.compound_id === compoundOf(candidateId));
    return own.length ? own : batches;
  };
  const chooseCandidate = (candidateId: string) =>
    setDraft((d) => ({
      ...d,
      candidate_id: candidateId,
      material_batch_id: batchesFor(candidateId)[0]?.id ?? "",
    }));

  const submit = () => {
    if (busy || !allowed) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson<WorkPackage>("/api/demo/work-packages", toBody(draft, key));
      if (!result.ok) return setError(result.error);
      reset();
      router.push(`/demo/w5-wet-lab/${encodeURIComponent(result.data.id)}`);
    });
  };

  return (
    <form
      aria-label="Create a work package"
      className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <SelectField
        label="Candidate"
        value={draft.candidate_id}
        onChange={chooseCandidate}
        options={candidates.map((c) => ({
          value: c.id,
          label: `${c.display_id} (rank ${c.rank})`,
        }))}
      />
      <SelectField
        label="Material batch"
        value={draft.material_batch_id}
        onChange={set("material_batch_id")}
        options={batchesFor(draft.candidate_id).map((b) => ({
          value: b.id,
          label: `${b.batch_ref} · ${b.availability}${b.identity_accepted ? "" : " · identity not accepted"}`,
        }))}
      />
      <div className="sm:col-span-2">
        <TextField
          label="Hypothesis"
          value={draft.hypothesis}
          onChange={set("hypothesis")}
          multiline
        />
      </div>
      <TextField
        label="Assay endpoint"
        value={draft.assay_endpoint}
        onChange={set("assay_endpoint")}
      />
      <TextField
        label="Protocol version"
        value={draft.protocol_version}
        onChange={set("protocol_version")}
      />
      <TextField
        label="Controls (comma-separated)"
        value={draft.controls}
        onChange={set("controls")}
      />
      <TextField
        label="Concentrations in µM (comma-separated)"
        value={draft.concentrations_um}
        onChange={set("concentrations_um")}
      />
      <TextField
        label="Replicates"
        type="number"
        value={draft.replicates}
        onChange={set("replicates")}
      />
      <TextField
        label="Deliverables (comma-separated)"
        value={draft.deliverables}
        onChange={set("deliverables")}
      />
      <SelectField
        label="Scenario"
        value={draft.scenario}
        onChange={set("scenario")}
        options={[
          { value: "standard", label: "Standard" },
          { value: "missing_sample", label: "Missing sample (reconciliation hold)" },
        ]}
      />
      <div className="flex items-end">
        <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
          Submit work package
        </Button>
      </div>
      <div className="sm:col-span-2">
        <ErrorNotice error={error} />
      </div>
    </form>
  );
}
