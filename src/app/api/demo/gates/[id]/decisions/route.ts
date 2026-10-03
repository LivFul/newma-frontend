import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseGateDecision } from "@/lib/demo/parse-gates";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: a signed gate decision (scientific approver); a replay keeps 200 + Idempotent-Replayed. */
export const POST = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const body = parseGateDecision(await readJson(req));
  if (!body) return validationError();
  return proxy(`/v1/gates/${id}/decisions`, { method: "POST", body, sessionId });
});
