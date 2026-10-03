import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: one rights record. */
export const GET = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id) ? proxy(`/v1/rights/records/${id}`, { sessionId }) : invalidId(),
);
