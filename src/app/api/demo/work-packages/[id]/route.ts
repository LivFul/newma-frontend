import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: one poll of a work package (loop states, ELN record, holds). */
export const GET = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id) ? proxy(`/v1/work-packages/${id}`, { sessionId }) : invalidId(),
);
