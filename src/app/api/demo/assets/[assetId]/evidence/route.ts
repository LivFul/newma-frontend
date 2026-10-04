import { demoFetch } from "@/lib/demo/api";
import { isSafeId } from "@/lib/demo/bff";
import { nullWithheldValues, parseEvidenceQuery } from "@/lib/demo/parse-exports";
import { forward, invalidId, validationError, withParams } from "@/lib/demo/proxy";

/** GET: the partner evidence pack for a candidate (read-only). Withheld rows never carry a value. */
export const GET = withParams<{ assetId: string }>(async ({ req, sessionId }, { assetId }) => {
  if (!isSafeId(assetId)) return invalidId();
  const query = parseEvidenceQuery(req.nextUrl.searchParams);
  if (!query) return validationError("Unknown stage or purpose.");
  const result = await demoFetch(`/v1/assets/${assetId}/evidence`, { sessionId, query });
  return forward({ ...result, data: nullWithheldValues(result.data) });
});
