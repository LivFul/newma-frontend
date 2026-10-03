import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: the signed manifest of one event, with the exact canonical string that was signed. */
export const GET = withParams<{ eventId: string }>(async ({ sessionId }, { eventId }) =>
  isSafeId(eventId)
    ? proxy(`/v1/provenance/events/${eventId}/manifest`, { sessionId })
    : invalidId(),
);
