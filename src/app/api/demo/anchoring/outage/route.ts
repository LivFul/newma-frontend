import { readJson, withSession } from "@/lib/demo/bff";
import { parseOutage } from "@/lib/demo/parse-settlement";
import { proxy, validationError } from "@/lib/demo/proxy";

const PATH = "/v1/demo/anchoring/outage";

export const GET = withSession(({ sessionId }) => proxy(PATH, { sessionId }));

/** PUT: simulate a chain outage (A26); an absolute state, so it takes no idempotency key. */
export const PUT = withSession(async ({ req, sessionId }) => {
  const body = parseOutage(await readJson(req));
  if (!body) return validationError();
  return proxy(PATH, { method: "PUT", body, sessionId });
});
