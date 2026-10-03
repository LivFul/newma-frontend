import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseElnEdit } from "@/lib/demo/parse-lab";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** POST: demo-only edit of a Mock ELN record (bumps its revision; LAB-05). */
export const POST = withParams<{ recordId: string }>(async ({ req, sessionId }, { recordId }) => {
  if (!isSafeId(recordId)) return invalidId();
  const body = parseElnEdit(await readJson(req));
  if (!body) return validationError();
  return proxy(`/v1/demo/eln/records/${recordId}/edit`, { method: "POST", body, sessionId });
});
