import { readJson, withSession } from "@/lib/demo/bff";
import { parseRightsRecord } from "@/lib/demo/parse-rights";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: the tenant's rights registry. */
export const GET = withSession(async ({ sessionId }) => proxy("/v1/rights/records", { sessionId }));

/** POST: record a rights/consent entry (community liaison, data steward). */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseRightsRecord(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/rights/records", { method: "POST", body, sessionId });
});
