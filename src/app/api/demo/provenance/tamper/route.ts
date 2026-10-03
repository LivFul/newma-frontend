import { readJson, withSession } from "@/lib/demo/bff";
import { parseTamper } from "@/lib/demo/parse-provenance";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: demo tamper toggle (A-P3-09): an altered copy with the original signature; never persisted. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseTamper(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/demo/provenance/tamper", { method: "POST", body, sessionId });
});
