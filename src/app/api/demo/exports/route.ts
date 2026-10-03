import { demoFetch } from "@/lib/demo/api";
import { readJson, withSession } from "@/lib/demo/bff";
import { parseExportRequest, parseLimitQuery, sanitiseExport } from "@/lib/demo/parse-exports";
import { forward, proxy, validationError } from "@/lib/demo/proxy";

/** GET: the tenant's exports, newest first (partner, tenant admin). */
export const GET = withSession(async ({ req, sessionId }) => {
  const query = parseLimitQuery(req.nextUrl.searchParams);
  if (!query) return validationError("limit must be between 1 and 100.");
  return proxy("/v1/exports", { sessionId, query });
});

/** POST: issue a controlled export (partner). A replay keeps the backend's 200 and header. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = parseExportRequest(await readJson(req));
  if (!body) return validationError();
  const result = await demoFetch("/v1/exports", { method: "POST", body, sessionId });
  return forward({ ...result, data: sanitiseExport(result.data) });
});
