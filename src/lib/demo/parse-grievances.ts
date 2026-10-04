import { isRecord, oneOf, withIdempotencyKey } from "./guards";
import { isSafeId } from "./safe-id";
import { GRIEVANCE_CATEGORIES, GRIEVANCE_STATUSES } from "./types";

// W10 grievance guards (JSON body, plain-form body and list filters); undefined = reject.
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 1000;

/** The only error codes the plain form's redirect may carry; the page renders a sentence for each. */
export const GRIEVANCE_REDIRECT_ERRORS = Object.freeze([
  "persona_forbidden",
  "validation_error",
  "not_found",
  "idempotency_conflict",
  "upstream_error",
] as const);
export type GrievanceRedirectError = (typeof GRIEVANCE_REDIRECT_ERRORS)[number];

const isCategory = oneOf(GRIEVANCE_CATEGORIES);
const isStatus = oneOf(GRIEVANCE_STATUSES);
const isId = (value: unknown): value is string => typeof value === "string" && isSafeId(value);

export function parseGrievanceRequest(body: unknown): Record<string, unknown> | undefined {
  if (!isRecord(body)) return undefined;
  const { rights_record_id, obligation_id, category, description } = body;
  if (!isId(rights_record_id) || !isCategory(category) || typeof description !== "string") {
    return undefined;
  }
  const trimmed = description.trim();
  if (trimmed.length < DESCRIPTION_MIN || trimmed.length > DESCRIPTION_MAX) return undefined;
  if (obligation_id !== undefined && !isId(obligation_id)) return undefined;
  return withIdempotencyKey({
    rights_record_id,
    ...(obligation_id === undefined ? {} : { obligation_id }),
    category,
    description: trimmed,
    idempotency_key: body.idempotency_key,
  });
}

/** Form fields to a JSON-shaped body; an empty optional obligation means "none". */
export function grievanceFromForm(form: URLSearchParams): Record<string, unknown> {
  const obligation = form.get("obligation_id");
  return {
    rights_record_id: form.get("rights_record_id") ?? undefined,
    ...(obligation ? { obligation_id: obligation } : {}),
    category: form.get("category") ?? undefined,
    // Browsers send newlines as CRLF; the backend counts characters, so normalise before the check.
    description: form.get("description")?.replaceAll("\r\n", "\n"),
    idempotency_key: form.get("idempotency_key") ?? undefined,
  };
}

export function parseGrievanceListQuery(
  params: URLSearchParams,
): { status?: string; rights_record_id?: string } | undefined {
  const status = params.get("status") ?? undefined;
  const record = params.get("rights_record_id") ?? undefined;
  if (status !== undefined && !isStatus(status)) return undefined;
  if (record !== undefined && !isSafeId(record)) return undefined;
  return {
    ...(status === undefined ? {} : { status }),
    ...(record === undefined ? {} : { rights_record_id: record }),
  };
}
