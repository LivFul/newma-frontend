import { readJson, withSession } from "@/lib/demo/bff";
import { parsePolicyRequest } from "@/lib/demo/parse-rights";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: evaluate purpose + action on an asset; tenant and persona come from the session. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parsePolicyRequest(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/policy/evaluate", { method: "POST", body, sessionId });
});
