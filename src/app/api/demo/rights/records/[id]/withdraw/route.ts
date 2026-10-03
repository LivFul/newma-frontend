import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseWithdraw } from "@/lib/demo/parse-rights";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: withdraw consent; the backend invalidates dependent cache entries (community liaison). */
export const POST = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const body = parseWithdraw(await readJson(req));
  if (!body) return validationError("A reason is required.");
  return proxy(`/v1/rights/records/${id}/withdraw`, { method: "POST", body, sessionId });
});
