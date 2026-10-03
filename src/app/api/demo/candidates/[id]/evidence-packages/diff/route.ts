import { isSafeId } from "@/lib/demo/bff";
import { parseDiffQuery } from "@/lib/demo/parse-gates";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** GET: JSON-path diff between two evidence-package versions (integers). */
export const GET = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const query = parseDiffQuery(req.nextUrl.searchParams);
  if (!query) return validationError("from and to must be version numbers.");
  return proxy(`/v1/candidates/${id}/evidence-packages/diff`, { sessionId, query });
});
