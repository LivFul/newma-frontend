import { isFiniteNumber, isNonEmptyString, isRecord, isUuid, withIdempotencyKey } from "./guards";

const MAX_OBJECTIVE = 2000;
const MAX_BUDGET = 1_000_000;

/** W3 agent query body; the agent never receives anything but these four fields. */
export function parseAgentQuery(body: unknown) {
  if (!isRecord(body)) return undefined;
  const { objective, target_id, budget_credits } = body;
  if (!isNonEmptyString(objective) || objective.length > MAX_OBJECTIVE) return undefined;
  if (!isUuid(target_id)) return undefined;
  if (!isFiniteNumber(budget_credits) || budget_credits < 0 || budget_credits > MAX_BUDGET) {
    return undefined;
  }
  return withIdempotencyKey({
    objective: objective.trim(),
    target_id,
    budget_credits,
    idempotency_key: body.idempotency_key,
  });
}
