import { readJson, withSession } from "@/lib/demo/bff";
import { parseAssayImport } from "@/lib/demo/parse-lab";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: import Mock ELN results; a duplicate is the backend's 200 original, forwarded unchanged. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseAssayImport(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/assay-imports", { method: "POST", body, sessionId });
});
