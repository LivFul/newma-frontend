import { isEvidenceLabel } from "@/lib/evidence";
import { isNonEmptyString, isRecord, isUuid, oneOf, withIdempotencyKey } from "./guards";

// W2 query and body guards at the BFF boundary; undefined means "reject with 422".
// Backend cursors are unpadded base64url of {k, id}; k can be up to 400 characters of UTF-8.
const CURSOR = /^[A-Za-z0-9_-]{1,4096}$/;
const LIMIT = /^(?:[1-9]|[1-9][0-9]|100)$/;
const isClaimStatus = oneOf([
  "pending_review",
  "quarantined",
  "approved",
  "rejected",
  "released",
] as const);
const isClaimDecision = oneOf(["approve", "reject"] as const);

const MAX_RATIONALE = 2000;
const MAX_RELEASE_CLAIMS = 200;

export const isCursor = (value: string): boolean => CURSOR.test(value);

export type PageQuery = Readonly<Record<string, string | undefined>>;

/** cursor stays opaque (never decoded here); limit 1–100; observation filters validated. */
export function parsePageQuery(params: URLSearchParams, filters: boolean): PageQuery | undefined {
  const cursor = params.get("cursor") ?? undefined;
  const limit = params.get("limit") ?? undefined;
  if (cursor !== undefined && !CURSOR.test(cursor)) return undefined;
  if (limit !== undefined && !LIMIT.test(limit)) return undefined;
  if (!filters) return { cursor, limit };
  const compoundId = params.get("compound_id") ?? undefined;
  const label = params.get("evidence_label") ?? undefined;
  if (compoundId !== undefined && !isUuid(compoundId)) return undefined;
  if (label !== undefined && !isEvidenceLabel(label)) return undefined;
  return { cursor, limit, compound_id: compoundId, evidence_label: label };
}

export function parseQueueStatus(params: URLSearchParams): { status?: string } | undefined {
  const status = params.get("status") ?? undefined;
  if (status !== undefined && !isClaimStatus(status)) return undefined;
  return { status };
}

export function parseIngestion(body: unknown) {
  if (!isRecord(body) || !isUuid(body.source_record_id)) return undefined;
  return withIdempotencyKey({
    source_record_id: body.source_record_id,
    idempotency_key: body.idempotency_key,
  });
}

export function parseClaimDecision(body: unknown) {
  if (!isRecord(body) || !isClaimDecision(body.decision) || !isNonEmptyString(body.rationale)) {
    return undefined;
  }
  if (body.rationale.length > MAX_RATIONALE) return undefined;
  return { decision: body.decision, rationale: body.rationale.trim() };
}

export function parseRelease(body: unknown) {
  if (!isRecord(body) || !Array.isArray(body.claim_ids) || body.claim_ids.length === 0)
    return undefined;
  if (body.claim_ids.length > MAX_RELEASE_CLAIMS || !body.claim_ids.every(isUuid)) return undefined;
  return withIdempotencyKey({
    claim_ids: [...new Set(body.claim_ids as string[])],
    idempotency_key: body.idempotency_key,
  });
}
