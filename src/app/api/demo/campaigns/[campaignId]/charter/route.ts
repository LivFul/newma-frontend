import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseCharterEdit } from "@/lib/demo/parse-campaigns";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** GET: the charter with its protocol versions (any persona). */
export const GET = withParams<{ campaignId: string }>(async ({ sessionId }, { campaignId }) => {
  if (!isSafeId(campaignId)) return invalidId();
  return proxy(`/v1/campaigns/${campaignId}/charter`, { sessionId });
});

/** PUT: edit the thresholds (tenant admin). 201 new version, 200 in-place, unchanged or replay. */
export const PUT = withParams<{ campaignId: string }>(
  async ({ req, sessionId }, { campaignId }) => {
    if (!isSafeId(campaignId)) return invalidId();
    const body = parseCharterEdit(await readJson(req));
    if (!body) return validationError("The thresholds, reason or version are invalid.");
    return proxy(`/v1/campaigns/${campaignId}/charter`, { method: "PUT", body, sessionId });
  },
);
