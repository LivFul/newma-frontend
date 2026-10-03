import { withSession } from "@/lib/demo/bff";
import { isUuid } from "@/lib/demo/guards";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: material batches, optionally for one candidate (UUID). */
export const GET = withSession(async ({ req, sessionId }) => {
  const candidateId = req.nextUrl.searchParams.get("candidate_id") ?? undefined;
  if (candidateId !== undefined && !isUuid(candidateId))
    return validationError("Invalid candidate_id.");
  return proxy("/v1/material-batches", { sessionId, query: { candidate_id: candidateId } });
});
