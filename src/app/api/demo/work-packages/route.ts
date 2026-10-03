import { readJson, withSession } from "@/lib/demo/bff";
import { parseWorkPackage } from "@/lib/demo/parse-lab";
import { proxy, validationError } from "@/lib/demo/proxy";

/** POST: a scientist's work package; an unmet material gate is 201 with status held. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseWorkPackage(await readJson(req));
  if (!body) return validationError();
  return proxy("/v1/work-packages", { method: "POST", body, sessionId });
});
