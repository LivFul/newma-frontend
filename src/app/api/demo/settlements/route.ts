import { readJson, withSession } from "@/lib/demo/bff";
import { parseSettlementCreate } from "@/lib/demo/parse-settlement";
import { proxy, validationError } from "@/lib/demo/proxy";

export const GET = withSession(({ sessionId }) => proxy("/v1/settlements", { sessionId }));

/** POST: finance opens the settlement for an approved license (A9). */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseSettlementCreate(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/settlements", { method: "POST", body, sessionId });
});
