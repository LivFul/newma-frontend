import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseAcceptance } from "@/lib/demo/parse-lab";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: a NEWMA scientist accepts an import (LAB-08); refused while reconciliation holds. */
export const POST = withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
  if (!isSafeId(id)) return invalidId();
  const body = parseAcceptance(await readJson(req));
  if (!body) return validationError("A rationale is required.");
  return proxy(`/v1/assay-imports/${id}/acceptance`, { method: "POST", body, sessionId });
});
