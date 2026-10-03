import { isBoundedString, isIsoDate, isRecord, isUuid, oneOf, withIdempotencyKey } from "./guards";

// W7 body guards at the BFF boundary (Contract A2–A26); undefined means "reject with 422".
// Only documented keys are forwarded; the client's stable idempotency key is kept, else minted.
const MIN_TEXT = 3;
const MAX_TEXT = 500;
const MAX_AMOUNT = 100_000_000;
const MAX_TERM_MONTHS = 120;
const EXTERNAL_REF = /^[A-Za-z0-9._:-]{1,60}$/;
const CREDENTIAL_REF = /^[A-Za-z0-9._:-]{1,64}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

const isPurpose = oneOf(["research", "commercial"] as const);
const isDecision = oneOf(["approve", "deny"] as const);

const trimmed = (value: unknown): string | undefined =>
  isBoundedString(value, MAX_TEXT * 2) &&
  value.trim().length >= MIN_TEXT &&
  value.trim().length <= MAX_TEXT
    ? value.trim()
    : undefined;

const isTermMonths = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= MAX_TERM_MONTHS;

const isAmount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= MAX_AMOUNT;

const matches = (pattern: RegExp, value: unknown): value is string =>
  typeof value === "string" && pattern.test(value);

export function parseLicenseRequest(body: unknown) {
  if (!isRecord(body)) return undefined;
  const scope = trimmed(body.scope_summary);
  const credential = body.credential_ref;
  const hasCredential = credential !== undefined && credential !== null;
  const ok =
    isUuid(body.agreement_id) &&
    isUuid(body.licensee_organization_id) &&
    isPurpose(body.purpose) &&
    scope !== undefined &&
    isTermMonths(body.term_months) &&
    (!hasCredential || matches(CREDENTIAL_REF, credential));
  if (!ok) return undefined;
  return withIdempotencyKey({
    agreement_id: body.agreement_id,
    licensee_organization_id: body.licensee_organization_id,
    purpose: body.purpose,
    scope_summary: scope,
    term_months: body.term_months,
    ...(hasCredential ? { credential_ref: credential } : {}),
    idempotency_key: body.idempotency_key,
  });
}

/** Key-only actions: credential-check, review, reconcile, distribution. */
export function parseCredentialCheck(body: unknown) {
  return isRecord(body) ? withIdempotencyKey({ idempotency_key: body.idempotency_key }) : undefined;
}
export const parseKeyOnly = parseCredentialCheck;

export function parseLicenseDecision(body: unknown) {
  if (!isRecord(body) || !isDecision(body.decision)) return undefined;
  const rationale = trimmed(body.rationale);
  if (rationale === undefined) return undefined;
  return withIdempotencyKey({
    decision: body.decision,
    rationale,
    idempotency_key: body.idempotency_key,
  });
}

export function parseSettlementCreate(body: unknown) {
  if (!isRecord(body) || !isUuid(body.license_id)) return undefined;
  return withIdempotencyKey({ license_id: body.license_id, idempotency_key: body.idempotency_key });
}

export function parseReceipt(body: unknown) {
  if (!isRecord(body)) return undefined;
  if (!matches(EXTERNAL_REF, body.external_ref) || !isAmount(body.amount_demo_credits)) {
    return undefined;
  }
  return withIdempotencyKey({
    external_ref: body.external_ref,
    amount_demo_credits: body.amount_demo_credits,
    idempotency_key: body.idempotency_key,
  });
}

export function parseDispute(body: unknown) {
  if (!isRecord(body) || !isUuid(body.receipt_id)) return undefined;
  const reason = trimmed(body.reason);
  if (reason === undefined) return undefined;
  return withIdempotencyKey({
    receipt_id: body.receipt_id,
    reason,
    idempotency_key: body.idempotency_key,
  });
}

export function parseResolve(body: unknown) {
  if (!isRecord(body) || !isUuid(body.receipt_id)) return undefined;
  const rationale = trimmed(body.rationale);
  if (rationale === undefined) return undefined;
  return withIdempotencyKey({
    receipt_id: body.receipt_id,
    rationale,
    idempotency_key: body.idempotency_key,
  });
}

/** evidence-approval: a rationale and the key. */
export function parseRationaleRequest(body: unknown) {
  if (!isRecord(body)) return undefined;
  const rationale = trimmed(body.rationale);
  if (rationale === undefined) return undefined;
  return withIdempotencyKey({ rationale, idempotency_key: body.idempotency_key });
}

export function parseApproval(body: unknown) {
  if (!isRecord(body) || !matches(SHA256_HEX, body.calculation_sha256)) return undefined;
  const rationale = trimmed(body.rationale);
  if (rationale === undefined) return undefined;
  return withIdempotencyKey({
    calculation_sha256: body.calculation_sha256,
    rationale,
    idempotency_key: body.idempotency_key,
  });
}

export function parseAudit(body: unknown) {
  if (!isRecord(body) || typeof body.anchor !== "boolean") return undefined;
  return withIdempotencyKey({ anchor: body.anchor, idempotency_key: body.idempotency_key });
}

export function parseSchedule(body: unknown) {
  if (!isRecord(body) || !isIsoDate(body.scheduled_for)) return undefined;
  return withIdempotencyKey({
    scheduled_for: body.scheduled_for,
    idempotency_key: body.idempotency_key,
  });
}

export function parseDeliver(body: unknown) {
  if (!isRecord(body)) return undefined;
  const note = trimmed(body.evidence_note);
  if (note === undefined) return undefined;
  return withIdempotencyKey({ evidence_note: note, idempotency_key: body.idempotency_key });
}

/** The outage switch sets an absolute state and takes no idempotency key (A26). */
export function parseOutage(body: unknown) {
  return isRecord(body) && typeof body.active === "boolean" ? { active: body.active } : undefined;
}
