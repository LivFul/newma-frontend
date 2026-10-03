import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseDisposition } from "@/lib/demo/parse-lab";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: the scientist's disposition for a held sample. */
export const POST = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const body = parseDisposition(await readJson(req));
  if (!body) return validationError();
  return proxy(`/v1/reconciliation/items/${id}/disposition`, { method: "POST", body, sessionId });
});
