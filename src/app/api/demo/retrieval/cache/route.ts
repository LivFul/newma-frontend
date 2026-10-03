import { withSession } from "@/lib/demo/bff";
import { isUuid } from "@/lib/demo/guards";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: retrieval cache entries, optionally for one subject (UUID). */
export const GET = withSession(async ({ req, sessionId }) => {
  const subjectId = req.nextUrl.searchParams.get("subject_id") ?? undefined;
  if (subjectId !== undefined && !isUuid(subjectId)) return validationError("Invalid subject_id.");
  return proxy("/v1/retrieval/cache", { sessionId, query: { subject_id: subjectId } });
});
