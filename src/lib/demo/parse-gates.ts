import { isNonEmptyString, isPositiveInt, isRecord, oneOf, withIdempotencyKey } from "./guards";

const isGateDecision = oneOf(["pass", "fail", "hold"] as const);
const VERSION = /^[1-9][0-9]{0,5}$/;
const MAX_RATIONALE = 2000;

export function parseDiffQuery(params: URLSearchParams): { from: string; to: string } | undefined {
  const from = params.get("from");
  const to = params.get("to");
  return from && to && VERSION.test(from) && VERSION.test(to) ? { from, to } : undefined;
}

/** W4 signed decision; the step-up confirmation is the re-typed candidate display id (A-P3-07). */
export function parseGateDecision(body: unknown) {
  if (!isRecord(body)) return undefined;
  const { decision, rationale, evidence_package_version, confirm_candidate_display_id } = body;
  if (
    !isGateDecision(decision) ||
    !isNonEmptyString(rationale) ||
    rationale.length > MAX_RATIONALE
  ) {
    return undefined;
  }
  if (!isPositiveInt(evidence_package_version) || !isNonEmptyString(confirm_candidate_display_id)) {
    return undefined;
  }
  return withIdempotencyKey({
    decision,
    rationale: rationale.trim(),
    evidence_package_version,
    confirm_candidate_display_id: confirm_candidate_display_id.trim(),
    idempotency_key: body.idempotency_key,
  });
}
