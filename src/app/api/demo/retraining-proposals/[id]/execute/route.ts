import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** POST: exists to make the refusal visible; the backend always answers 409 retraining_not_authorized. */
export const POST = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id)
    ? proxy(`/v1/retraining-proposals/${id}/execute`, { method: "POST", sessionId })
    : invalidId(),
);
