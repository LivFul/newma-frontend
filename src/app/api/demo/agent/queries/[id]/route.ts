import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: one poll of an agent query (steps derive from its jobs server-side). No approve route exists. */
export const GET = withParams<{ id: string }>(async ({ sessionId }, { id }) =>
  isSafeId(id) ? proxy(`/v1/agent/queries/${id}`, { sessionId }) : invalidId(),
);
