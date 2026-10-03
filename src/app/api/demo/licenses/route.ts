import { readJson, withSession } from "@/lib/demo/bff";
import { parseLicenseRequest } from "@/lib/demo/parse-settlement";
import { proxy, validationError } from "@/lib/demo/proxy";

export const GET = withSession(({ sessionId }) => proxy("/v1/licenses", { sessionId }));

/** POST: a partner's license request (A2); a replay is 200 with Idempotent-Replayed. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseLicenseRequest(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/licenses", { method: "POST", body, sessionId });
});
