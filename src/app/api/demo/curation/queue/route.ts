import { withSession } from "@/lib/demo/bff";
import { parseQueueStatus } from "@/lib/demo/parse-curation";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: extracted claims awaiting review (optionally filtered by status). */
export const GET = withSession(async ({ req, sessionId }) => {
  const query = parseQueueStatus(req.nextUrl.searchParams);
  if (!query) return validationError("Invalid status.");
  return proxy("/v1/curation/queue", { sessionId, query });
});
