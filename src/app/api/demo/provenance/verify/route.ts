import { readJson, withSession } from "@/lib/demo/bff";
import { parseVerify } from "@/lib/demo/parse-provenance";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: verify a manifest's demo signature; there is no tamper flag in production verify. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseVerify(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/provenance/verify", { method: "POST", body, sessionId });
});
