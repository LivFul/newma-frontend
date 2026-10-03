import { withSession } from "@/lib/demo/bff";
import { parsePageQuery } from "@/lib/demo/parse-curation";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: one keyset page of taxa; the cursor is forwarded opaque (A-P3-13). */
export const GET = withSession(async ({ req, sessionId }) => {
  const query = parsePageQuery(req.nextUrl.searchParams, false);
  if (!query) return validationError("Invalid page query.");
  return proxy("/v1/taxa", { sessionId, query });
});
