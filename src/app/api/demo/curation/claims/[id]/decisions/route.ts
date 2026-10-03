import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseClaimDecision } from "@/lib/demo/parse-curation";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: approve or reject an extracted claim (data steward). */
export const POST = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const body = parseClaimDecision(await readJson(req));
  if (!body) return validationError("A decision and a rationale are required.");
  return proxy(`/v1/curation/claims/${id}/decisions`, { method: "POST", body, sessionId });
});
