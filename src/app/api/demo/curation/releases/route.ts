import { readJson, withSession } from "@/lib/demo/bff";
import { parseRelease } from "@/lib/demo/parse-curation";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: publish a curated release of approved claims. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseRelease(await readJson(req));
  if (!body) return validationError("Select at least one approved claim.");
  return proxy("/v1/curation/releases", { method: "POST", body, sessionId });
});
