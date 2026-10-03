"use client";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import type { ExportRecord, ExportStatus } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, TextField } from "../../_components/fields";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import type { ExportPackInfo } from "./export-pack-info";
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

type Props = Readonly<{
  pack: ExportPackInfo;
  allowed: boolean;
  /** Current status per export id from the register, so a stale result card never says "Active". */
  liveStatuses?: Readonly<Record<string, ExportStatus>>;
}>;
type Outcome =
  | Readonly<{ kind: "issued"; record: ExportRecord }>
  | Readonly<{ kind: "refused"; error: ClientError }>
  | Readonly<{ kind: "error"; error: ClientError }>;

// One attempt = one idempotency key and one expiry. The backend compares the whole request on a
// replay, so a retry after an unknown outcome must resend the same instant; any edit starts anew.
type Attempt = Readonly<{ signature: string; key: string; expiresAt: string }>;

function FieldChecklist(props: {
  pack: ExportPackInfo;
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

/** The issued card follows the register: a suspended or expired export shows no body. */
function currentRecord(record: ExportRecord, live: ExportStatus | undefined): ExportRecord {
  const status = live ?? record.status;
  return status === "active" ? record : { ...record, status, disclosed: [] };
}

export function ExportForm({ pack, allowed, liveStatuses = {} }: Props) {
  const router = useRouter();
  const headingId = useId();
  const attempt = useRef<Attempt | undefined>(undefined);
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [days, setDays] = useState(String(DEFAULT_DAYS));
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
    const paths = pack.fields.map((f) => f.path).filter((p) => selected.has(p));
    const stage = pack.requested_stage ?? pack.stage;
    const signature = JSON.stringify([recipient.trim(), days, paths]);
    if (attempt.current?.signature !== signature) {
      attempt.current = {
        signature,
        key: crypto.randomUUID(),
        expiresAt: expiryFrom(Number(days)),
      };
    }
    const { key, expiresAt } = attempt.current;
    const body = {
      asset_id: pack.asset_id,
      ...(stage ? { stage } : {}),
      purpose: pack.purpose,
      recipient: recipient.trim(),
      expires_at: expiresAt,
      ...(paths.length === pack.fields.length ? {} : { field_paths: paths }),
      idempotency_key: key,
    };
    void run(async () => {
      const result = await postJson<ExportRecord>("/api/demo/exports", body);
      // A definitive answer ends the attempt; a network failure or 5xx retries with the same one.
      if (result.ok || (result.status >= 400 && result.status < 500)) attempt.current = undefined;
      if (result.ok) setOutcome({ kind: "issued", record: result.data });
      else {
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
        <fieldset disabled={!allowed} className="contents">
          <TextField label="Recipient" value={recipient} onChange={setRecipient} />
          <SelectField
            label="Expires in"
            value={days}
            onChange={setDays}
            options={DAY_CHOICES.map((n) => ({ value: String(n), label: `${n} days` }))}
          />
          <p className="text-sm sm:col-span-2">
            Purpose: <strong>{pack.purpose}</strong> (change it with the purpose links above)
          </p>
          <div className="sm:col-span-2">
            <FieldChecklist pack={pack} selected={selected} onToggle={toggle} />
          </div>
        </fieldset>
        <div>
          <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
            Issue export
          </Button>
        </div>
      </form>
      <div role="status" aria-live="polite" className="sr-only">
        {outcome?.kind === "issued" ? `Export issued for ${outcome.record.recipient}.` : ""}
      </div>
      {outcome?.kind === "error" ? <ErrorNotice error={outcome.error} /> : null}
      {outcome?.kind === "refused" ? (
        <ExportRefusal message={outcome.error.message} details={outcome.error.details} />
      ) : null}
      {outcome?.kind === "issued" ? (
        <ExportResult record={currentRecord(outcome.record, liveStatuses[outcome.record.id])} />
      ) : null}
    </section>
  );
}
