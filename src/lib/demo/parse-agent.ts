import { isFiniteNumber, isNonEmptyString, isRecord, withIdempotencyKey } from "./guards";
import { isSafeId } from "./safe-id";

const MAX_OBJECTIVE = 2000;

/** W3 agent query body; the agent never receives anything but these four fields. */
export function parseAgentQuery(body: unknown) {
  if (!isRecord(body)) return undefined;
  const { objective, target_id, budget_credits } = body;
  if (!isNonEmptyString(objective) || objective.length > MAX_OBJECTIVE) return undefined;
  if (typeof target_id !== "string" || !isSafeId(target_id)) return undefined;
  if (!isFiniteNumber(budget_credits) || budget_credits < 0) return undefined;
  return withIdempotencyKey({
    objective: objective.trim(),
    target_id,
    budget_credits,
    idempotency_key: body.idempotency_key,
  });
}
