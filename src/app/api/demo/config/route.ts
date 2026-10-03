import { readJson, withSession } from "@/lib/demo/bff";
import { parseConfigUpdate } from "@/lib/demo/parse-config";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: the effective demo speed for this tenant and where it comes from. */
export const GET = withSession(({ sessionId }) => proxy("/v1/demo/config", { sessionId }));

/** PUT {speed_factor}: set (1-10) or clear (null) this tenant's speed override. */
export const PUT = withSession(async ({ req, sessionId }) => {
  const body = parseConfigUpdate(await readJson(req));
  if (!body) return validationError("The demo speed must be from 1 to 10, or null.");
  return proxy("/v1/demo/config", { method: "PUT", body, sessionId });
});
