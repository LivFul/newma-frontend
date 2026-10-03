"use client";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { type ClientError, putJson, requestJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import { THRESHOLD_LIMITS } from "@/lib/demo/parse-campaigns";
import type { CharterChange, CharterOut } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";
import { TextField } from "../../_components/fields";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";

const invalid = (message: string): ClientError => ({ code: "validation_error", message });

/** The outcome in words (A-P5B-10). */
export function describeChange(change: CharterChange): string {
  const { outcome, previous_version, charter } = change;
  if (outcome === "new_protocol_version") {
    return `Protocol version ${charter.protocol_version} created, version ${previous_version} is unchanged`;
  }
  if (outcome === "unchanged") return "No change";
  const revision = charter.versions.find((v) => v.version === charter.protocol_version)?.revision;
  return `Open version ${charter.protocol_version} updated (revision ${revision ?? "?"})`;
}

/** charter_version_conflict names the version that won; the page refreshes to show it. */
function conflictText(error: ClientError): ClientError {
  const details = error.details as { current_version?: unknown } | undefined;
  if (error.code !== "charter_version_conflict" || typeof details?.current_version !== "number") {
    return error;
  }
  return {
    code: error.code,
    message: `Another change already created protocol version ${details.current_version}. The page was refreshed: check the thresholds and save again.`,
  };
}

type Draft = Readonly<{
  potency: string;
  replicates: string;
  controls: boolean;
  note: string;
  reason: string;
}>;

function toBody(draft: Draft, version: number, key: string) {
  const note = draft.note.trim();
  return {
    thresholds: {
      potency_um_max: Number(draft.potency),
      replicates_min: Number(draft.replicates),
      controls_required: draft.controls,
      ...(note ? { note } : {}),
    },
    change_reason: draft.reason.trim(),
    expected_version: version,
    idempotency_key: key,
  };
}

function check(draft: Draft): ClientError | undefined {
  const potency = Number(draft.potency);
  const replicates = Number(draft.replicates);
  if (!Number.isFinite(potency) || potency <= 0 || potency > THRESHOLD_LIMITS.potencyMax) {
    return invalid(
      `Potency maximum must be above 0 and at most ${THRESHOLD_LIMITS.potencyMax} µM.`,
    );
  }
  if (
    !Number.isInteger(replicates) ||
    replicates < THRESHOLD_LIMITS.replicatesMin ||
    replicates > THRESHOLD_LIMITS.replicatesMax
  ) {
    return invalid("Minimum replicates must be a whole number from 1 to 10.");
  }
  if (draft.note.trim().length > THRESHOLD_LIMITS.noteMax) return invalid("The note is too long.");
  return draft.reason.trim().length < THRESHOLD_LIMITS.reasonMin
    ? invalid("A reason of at least 3 characters is required.")
    : undefined;
}

type Props = Readonly<{ charter: CharterOut; allowed: boolean }>;

export function ThresholdForm({ charter, allowed }: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const controlsId = useId();
  const [draft, setDraft] = useState<Draft>({
    potency: String(charter.thresholds.potency_um_max),
    replicates: String(charter.thresholds.replicates_min),
    controls: charter.thresholds.controls_required,
    note: charter.thresholds.note ?? "",
    reason: "",
  });
  const [result, setResult] = useState<string | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();
  const set = (field: "potency" | "replicates" | "note" | "reason") => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));

  // After a version conflict the draft is replaced by the winning thresholds (the reason is kept).
  const resync = async () => {
    const fresh = await requestJson<CharterOut>(
      `/api/demo/campaigns/${encodeURIComponent(charter.id)}/charter`,
    );
    if (fresh.ok) {
      const t = fresh.data.thresholds;
      setDraft((d) => ({
        ...d,
        potency: String(t.potency_um_max),
        replicates: String(t.replicates_min),
        controls: t.controls_required,
        note: t.note ?? "",
      }));
    }
  };

  const submit = () => {
    if (busy || !allowed) return;
    setResult(undefined);
    const problem = check(draft);
    if (problem) return setError(problem);
    setError(undefined);
    void run(async () => {
      const response = await putJson<CharterChange>(
        `/api/demo/campaigns/${encodeURIComponent(charter.id)}/charter`,
        toBody(draft, charter.protocol_version, key),
      );
      // A definitive answer ends this attempt; only a network failure or 5xx retries with the key.
      if (response.ok || (response.status >= 400 && response.status < 500)) reset();
      if (response.ok) {
        setResult(describeChange(response.data));
        setDraft((d) => ({ ...d, reason: "" }));
      } else {
        setError(conflictText(response.error));
        if (response.error.code === "charter_version_conflict") await resync();
      }
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="threshold-heading" className="space-y-3">
      <h2 id="threshold-heading" className="text-xl font-semibold">
        Edit thresholds
      </h2>
      {allowed ? null : <PersonaForbiddenNotice allowed={["tenant_admin"]} />}
      <form
        aria-label="Edit protocol thresholds"
        aria-busy={busy || undefined}
        className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={!allowed} className="contents">
          <TextField
            label="Potency maximum (µM)"
            type="number"
            value={draft.potency}
            onChange={set("potency")}
          />
          <TextField
            label="Minimum replicates"
            type="number"
            value={draft.replicates}
            onChange={set("replicates")}
          />
          <label htmlFor={controlsId} className="flex items-center gap-2 text-sm">
            <input
              id={controlsId}
              type="checkbox"
              checked={draft.controls}
              onChange={(event) => setDraft((d) => ({ ...d, controls: event.target.checked }))}
            />
            Controls required
          </label>
          <TextField label="Note (optional)" value={draft.note} onChange={set("note")} />
          <div className="sm:col-span-2">
            <TextField
              label="Reason for the change"
              value={draft.reason}
              onChange={set("reason")}
              multiline
            />
          </div>
        </fieldset>
        <div>
          <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
            Save thresholds
          </Button>
        </div>
      </form>
      <div role="status" aria-live="polite">
        {result ? (
          <p className="rounded-md border border-border-strong px-3 py-2 text-sm">{result}</p>
        ) : null}
      </div>
      <ErrorNotice error={error} />
    </section>
  );
}
