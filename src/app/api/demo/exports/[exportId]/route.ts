import { demoFetch } from "@/lib/demo/api";
import { isSafeId } from "@/lib/demo/bff";
import { sanitiseExport } from "@/lib/demo/parse-exports";
import { forward, invalidId, withParams } from "@/lib/demo/proxy";

/** GET: one export; the body is forwarded only while the export is active. */
export const GET = withParams<{ exportId: string }>(async ({ sessionId }, { exportId }) => {
  if (!isSafeId(exportId)) return invalidId();
  const result = await demoFetch(`/v1/exports/${exportId}`, { sessionId });
  return forward({ ...result, data: sanitiseExport(result.data) });
});
