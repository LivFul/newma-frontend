import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** POST: acknowledge a grievance (data steward). The request carries nothing but the id. */
export const POST = withParams<{ grievanceId: string }>(async ({ sessionId }, { grievanceId }) => {
  if (!isSafeId(grievanceId)) return invalidId();
  return proxy(`/v1/grievances/${grievanceId}/acknowledge`, {
    method: "POST",
    body: {},
    sessionId,
  });
});
