import { readJson, withSession } from "@/lib/demo/bff";
import { parseAgentQuery } from "@/lib/demo/parse-agent";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: ask the scripted (simulated) agent; 202 while its simulated jobs run (scientist). */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseAgentQuery(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/agent/queries", { method: "POST", body, sessionId });
});
