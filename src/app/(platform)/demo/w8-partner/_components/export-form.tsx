"use client";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import { useAction } from "@/lib/demo/use-action";
import {
  EXPORT_PURPOSES,
  type AssetEvidence,
  type ExportPurpose,
  type ExportRecord,
} from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, TextField } from "../../_components/fields";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { ExportRefusal, isRefusalCode } from "./export-refusal";
import { ExportResult } from "./export-result";

const DEFAULT_RECIPIENT = "Partner Biologics A — fictional";
const DAY_CHOICES = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const NEEDS_FICTIONAL: ClientError = {
  code: "validation_error",
  message: "The recipient must include the word “fictional”.",
};
const NEEDS_FIELD: ClientError = {
  code: "validation_error",
  message: "Select at least one field to include.",
};

/** UTC RFC 3339 instant `days` from `now`, without milliseconds (A-P5B-F04). */
export function expiryFrom(days: number, now: number = Date.now()): string {
  return new Date(now + days * DAY_MS).toISOString().replace(/\.\d{3}Z$/, "Z");
}

type Props = Readonly<{ pack: AssetEvidence; allowed: boolean }>;
type Outcome =
  | Readonly<{ kind: "issued"; record: ExportRecord }>
  | Readonly<{ kind: "refused"; error: ClientError }>
  | Readonly<{ kind: "error"; error: ClientError }>;

function FieldChecklist(props: {
  pack: AssetEvidence;
  selected: ReadonlySet<string>;
  onToggle: (path: string) => void;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">Fields to include</legend>
      {props.pack.fields.map((field) => (
        <label key={field.path} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={props.selected.has(field.path)}
            onChange={() => props.onToggle(field.path)}
          />
          {field.label}
          {field.status === "withheld" ? " (withheld in this pack)" : ""}
        </label>
      ))}
    </fieldset>
  );
}

export function ExportForm({ pack, allowed }: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const headingId = useId();
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [days, setDays] = useState(String(DEFAULT_DAYS));
  const [purpose, setPurpose] = useState<ExportPurpose>(pack.purpose);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(pack.fields.map((field) => field.path)),
  );
  const [outcome, setOutcome] = useState<Outcome | undefined>();
  const { busy, run } = useAction();
  const toggle = (path: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });

  const submit = () => {
    if (busy || !allowed) return;
    if (!/fictional/i.test(recipient)) return setOutcome({ kind: "error", error: NEEDS_FICTIONAL });
    if (selected.size === 0) return setOutcome({ kind: "error", error: NEEDS_FIELD });
    const all = selected.size === pack.fields.length;
    const stage = pack.requested_stage ?? pack.stage;
    const body = {
      asset_id: pack.asset_id,
      ...(stage ? { stage } : {}),
      purpose,
      recipient: recipient.trim(),
      expires_at: expiryFrom(Number(days)),
      ...(all
        ? {}
        : { field_paths: pack.fields.map((f) => f.path).filter((p) => selected.has(p)) }),
      idempotency_key: key,
    };
    void run(async () => {
      const result = await postJson<ExportRecord>("/api/demo/exports", body);
      if (result.ok) {
        reset();
        setOutcome({ kind: "issued", record: result.data });
      } else {
        setOutcome({
          kind: isRefusalCode(result.error.code) ? "refused" : "error",
          error: result.error,
        });
      }
      router.refresh();
    });
  };

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-xl font-semibold">
        Controlled export
      </h2>
      {allowed ? null : <PersonaForbiddenNotice allowed={["partner"]} />}
      <form
        aria-label="Issue a controlled export"
        aria-busy={busy || undefined}
        className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <TextField label="Recipient" value={recipient} onChange={setRecipient} />
        <SelectField
          label="Purpose"
          value={purpose}
          onChange={(value) => setPurpose(value as ExportPurpose)}
          options={EXPORT_PURPOSES.map((value) => ({ value, label: value }))}
        />
        <SelectField
          label="Expires in"
          value={days}
          onChange={setDays}
          options={DAY_CHOICES.map((n) => ({ value: String(n), label: `${n} days` }))}
        />
        <div className="sm:col-span-2">
          <FieldChecklist pack={pack} selected={selected} onToggle={toggle} />
        </div>
        <div>
          <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
            Issue export
          </Button>
        </div>
      </form>
      {outcome?.kind === "error" ? <ErrorNotice error={outcome.error} /> : null}
      {outcome?.kind === "refused" ? (
        <ExportRefusal message={outcome.error.message} details={outcome.error.details} />
      ) : null}
      {outcome?.kind === "issued" ? <ExportResult record={outcome.record} /> : null}
    </section>
  );
}
