import { withSession } from "@/lib/demo/bff";
import { parseGrievanceListQuery } from "@/lib/demo/parse-grievances";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: the grievance queue (community liaison, data steward, tenant admin). */
export const GET = withSession(async ({ req, sessionId }) => {
  const query = parseGrievanceListQuery(req.nextUrl.searchParams);
  if (!query) return validationError("Unknown status or record id.");
  return proxy("/v1/grievances", { sessionId, query });
});
