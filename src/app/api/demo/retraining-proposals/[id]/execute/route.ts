import { demoFetch } from "@/lib/demo/api";
import { errorJson, isSafeId } from "@/lib/demo/bff";
import { invalidId, withParams } from "@/lib/demo/proxy";

const REFUSAL = "Retraining requires separate authorization and is not available in the demo.";

/**
 * POST: exists to make the refusal visible. The backend always answers 409
 * retraining_not_authorized (IP C-04); a 2xx is an invariant violation, so it is logged here and
 * the BFF still refuses (the backend body is never forwarded).
 */
export const POST = withParams<{ id: string }>(async ({ sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const result = await demoFetch(`/v1/retraining-proposals/${id}/execute`, {
    method: "POST",
    sessionId,
  });
  console.error("retraining execute returned 2xx; invariant violation (IP C-04)", result.status);
  return errorJson(409, "retraining_not_authorized", REFUSAL);
});
