import { isBoundedString, isRecord, withIdempotencyKey } from "./guards";
import type { Thresholds } from "./types";

// W9 body guards at the BFF boundary (closed Thresholds object, A-P5B-10); undefined = 422.
export const THRESHOLD_LIMITS = Object.freeze({
  potencyMax: 1000,
  replicatesMin: 1,
  replicatesMax: 10,
  noteMax: 200,
  reasonMin: 3,
  reasonMax: 300,
  quotaMax: 1_000_000,
});

const isReason = (value: unknown): value is string =>
  isBoundedString(value, THRESHOLD_LIMITS.reasonMax) &&
  value.trim().length >= THRESHOLD_LIMITS.reasonMin;

const isIntInRange = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

export function parseThresholds(value: unknown): Thresholds | undefined {
  if (!isRecord(value)) return undefined;
  const { potency_um_max, replicates_min, controls_required, note } = value;
  if (
    typeof potency_um_max !== "number" ||
    !Number.isFinite(potency_um_max) ||
    potency_um_max <= 0 ||
    potency_um_max > THRESHOLD_LIMITS.potencyMax
  ) {
    return undefined;
  }
  if (
    !isIntInRange(replicates_min, THRESHOLD_LIMITS.replicatesMin, THRESHOLD_LIMITS.replicatesMax)
  ) {
    return undefined;
  }
  if (typeof controls_required !== "boolean") return undefined;
  if (
    note !== undefined &&
    !(typeof note === "string" && note.length <= THRESHOLD_LIMITS.noteMax)
  ) {
    return undefined;
  }
  const base = { potency_um_max, replicates_min, controls_required };
  return note === undefined ? base : { ...base, note };
}

export function parseCharterEdit(body: unknown): Record<string, unknown> | undefined {
  if (!isRecord(body)) return undefined;
  const thresholds = parseThresholds(body.thresholds);
  if (!thresholds || !isReason(body.change_reason)) return undefined;
  if (!Number.isSafeInteger(body.expected_version) || (body.expected_version as number) < 1) {
    return undefined;
  }
  return withIdempotencyKey({
    thresholds,
    change_reason: body.change_reason.trim(),
    expected_version: body.expected_version,
    idempotency_key: body.idempotency_key,
  });
}

export function parseQuotaEdit(
  body: unknown,
): { credit_quota: number; reason: string } | undefined {
  if (!isRecord(body)) return undefined;
  const { credit_quota, reason } = body;
  if (!isIntInRange(credit_quota, 0, THRESHOLD_LIMITS.quotaMax) || !isReason(reason)) {
    return undefined;
  }
  return { credit_quota, reason: reason.trim() };
}
