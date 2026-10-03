import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: evidence-package versions for a candidate. */
export const GET = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id) ? proxy(`/v1/candidates/${id}/evidence-packages`, { sessionId }) : invalidId(),
);
