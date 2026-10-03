import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: the candidate's H0–D gates with checks and missing requirements. */
export const GET = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id) ? proxy(`/v1/candidates/${id}/gates`, { sessionId }) : invalidId(),
);
