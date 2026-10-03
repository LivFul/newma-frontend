import { demoFetch } from "@/lib/demo/api";
import { BffError, noStore, readJson, withSession } from "@/lib/demo/bff";
import { pickConfig, parseConfigUpdate } from "@/lib/demo/parse-config";
import { validationError } from "@/lib/demo/proxy";

export const dynamic = "force-dynamic";

const badUpstream = () => new BffError(502, "upstream_error", "The demo backend is unavailable");

/** GET: the effective demo speed for this tenant and where it comes from. */
export const GET = withSession(async ({ sessionId }) => {
  const { data } = await demoFetch("/v1/demo/config", { sessionId });
  const config = pickConfig(data);
  if (!config) throw badUpstream();
  return noStore(config);
});

/** PUT {speed_factor}: set (1-10) or clear (null) this tenant's speed override. */
export const PUT = withSession(async ({ req, sessionId }) => {
  const body = parseConfigUpdate(await readJson(req));
  if (!body) return validationError("The demo speed must be from 1 to 10, or null.");
  const { data } = await demoFetch("/v1/demo/config", { method: "PUT", body, sessionId });
  const config = pickConfig(data);
  if (!config) throw badUpstream();
  return noStore(config);
});
