import { isBoundedStringArray, isRecord, oneOf, withIdempotencyKey } from "./guards";
import { isSafeId } from "./safe-id";
import { EXPORT_PURPOSES, GATE_STAGES } from "./types";

// W8 body, query and response guards at the BFF boundary; undefined means "reject with 422".
export const MAX_FIELD_PATHS = 40;
const MAX_PATH_LENGTH = 120;
const RECIPIENT_MIN = 3;
const RECIPIENT_MAX = 120;
const MAX_LIMIT = 100;
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/;

const isStage = oneOf(GATE_STAGES);
const isPurpose = oneOf(EXPORT_PURPOSES);

// Prompt §3.2: only fictional organisations enter the synthetic record (A-P5B-07).
const isRecipient = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length >= RECIPIENT_MIN &&
  value.trim().length <= RECIPIENT_MAX &&
  /fictional/i.test(value);

// Date.parse rolls 31 February over, so the calendar date must survive a round trip.
const isUtcInstant = (value: unknown): value is string => {
  if (typeof value !== "string" || !RFC3339_UTC.test(value)) return false;
  const time = Date.parse(value);
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value.slice(0, 10));
};

export function parseExportRequest(body: unknown): Record<string, unknown> | undefined {
  if (!isRecord(body)) return undefined;
  const { asset_id, stage, purpose, recipient, expires_at, field_paths } = body;
  if (typeof asset_id !== "string" || !isSafeId(asset_id)) return undefined;
  if (!isPurpose(purpose) || !isRecipient(recipient) || !isUtcInstant(expires_at)) return undefined;
  if (stage !== undefined && !isStage(stage)) return undefined;
  if (
    field_paths !== undefined &&
    !isBoundedStringArray(field_paths, MAX_FIELD_PATHS, MAX_PATH_LENGTH)
  ) {
    return undefined;
  }
  return withIdempotencyKey({
    asset_id,
    ...(stage === undefined ? {} : { stage }),
    purpose,
    recipient: recipient.trim(),
    expires_at,
    ...(field_paths === undefined ? {} : { field_paths }),
    idempotency_key: body.idempotency_key,
  });
}

export function parseEvidenceQuery(
  params: URLSearchParams,
): { stage?: string; purpose?: string } | undefined {
  const stage = params.get("stage") ?? undefined;
  const purpose = params.get("purpose") ?? undefined;
  if (stage !== undefined && !isStage(stage)) return undefined;
  if (purpose !== undefined && !isPurpose(purpose)) return undefined;
  return {
    ...(stage === undefined ? {} : { stage }),
    ...(purpose === undefined ? {} : { purpose }),
  };
}

export function parseLimitQuery(params: URLSearchParams): { limit?: string } | undefined {
  const limit = params.get("limit");
  if (limit === null) return {};
  const value = Number(limit);
  return /^[0-9]{1,3}$/.test(limit) && value >= 1 && value <= MAX_LIMIT ? { limit } : undefined;
}

// Defence in depth (Review Focus 2): a withheld row never carries a value, whatever upstream sends.
type Row = Record<string, unknown>;

function nullRow(row: unknown, forceWithheld: boolean): unknown {
  if (!isRecord(row)) return row;
  return forceWithheld || row.status === "withheld" ? { ...row, value: null } : row;
}

const mapRows = (rows: unknown, forceWithheld: boolean): unknown =>
  Array.isArray(rows) ? rows.map((row) => nullRow(row, forceWithheld)) : rows;

/** A copy of an evidence pack whose withheld rows have `value: null`. */
export function nullWithheldValues(pack: unknown): unknown {
  if (!isRecord(pack)) return pack;
  return { ...pack, fields: mapRows(pack.fields, false) } satisfies Row;
}

/** A copy of an export record: withheld rows nulled; the body is dropped unless `active`. */
export function sanitiseExport(record: unknown): unknown {
  if (!isRecord(record)) return record;
  const active = record.status === "active";
  return {
    ...record,
    disclosed: active ? mapRows(record.disclosed, false) : [],
    withheld: mapRows(record.withheld, true),
  } satisfies Row;
}
