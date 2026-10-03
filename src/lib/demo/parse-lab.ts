import {
  isFiniteNumber,
  isNonEmptyString,
  isPositiveInt,
  isRecord,
  isStringArray,
  isUuid,
  oneOf,
  withIdempotencyKey,
} from "./guards";
import { isSafeId } from "./safe-id";

// W5 body guards at the BFF boundary (LAB-01 fields); undefined means "reject with 422".
const isScenario = oneOf(["standard", "missing_sample"] as const);
const isDisposition = oneOf(["repeat_sample", "exclude_sample", "accept_with_deviation"] as const);
const MAX_TEXT = 2000;
const MAX_ITEMS = 50;

const isText = (value: unknown): value is string =>
  isNonEmptyString(value) && value.length <= MAX_TEXT;
const isList = (value: unknown): value is string[] =>
  isStringArray(value) && value.length >= 1 && value.length <= MAX_ITEMS && value.every(isText);
const isConcentrations = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length >= 1 &&
  value.length <= MAX_ITEMS &&
  value.every((v) => isFiniteNumber(v) && v > 0);

export function parseWorkPackage(body: unknown) {
  if (!isRecord(body)) return undefined;
  const b = body;
  const ok =
    isUuid(b.candidate_id) &&
    isUuid(b.material_batch_id) &&
    isText(b.hypothesis) &&
    isText(b.assay_endpoint) &&
    isText(b.protocol_version) &&
    isList(b.controls) &&
    isConcentrations(b.concentrations_um) &&
    isPositiveInt(b.replicates) &&
    isList(b.deliverables) &&
    isScenario(b.scenario);
  if (!ok) return undefined;
  return withIdempotencyKey({
    candidate_id: b.candidate_id,
    material_batch_id: b.material_batch_id,
    hypothesis: b.hypothesis,
    assay_endpoint: b.assay_endpoint,
    protocol_version: b.protocol_version,
    controls: b.controls,
    concentrations_um: b.concentrations_um,
    replicates: b.replicates,
    deliverables: b.deliverables,
    scenario: b.scenario,
    idempotency_key: b.idempotency_key,
  });
}

export function parseAssayImport(body: unknown) {
  if (!isRecord(body) || !isUuid(body.work_package_id)) return undefined;
  if (typeof body.eln_record_id !== "string" || !isSafeId(body.eln_record_id)) return undefined;
  return { work_package_id: body.work_package_id, eln_record_id: body.eln_record_id };
}

export function parseAcceptance(body: unknown) {
  if (!isRecord(body) || !isText(body.rationale)) return undefined;
  return withIdempotencyKey({
    rationale: body.rationale.trim(),
    idempotency_key: body.idempotency_key,
  });
}

export function parseDisposition(body: unknown) {
  if (!isRecord(body) || !isDisposition(body.disposition) || !isText(body.rationale))
    return undefined;
  return { disposition: body.disposition, rationale: body.rationale.trim() };
}

export function parseElnEdit(body: unknown) {
  return isRecord(body) && body.change === "correct_value"
    ? { change: "correct_value" }
    : undefined;
}
