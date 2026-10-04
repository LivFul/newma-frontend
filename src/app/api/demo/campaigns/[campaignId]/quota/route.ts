import { isSafeId, readJson } from "@/lib/demo/bff";
import { parseQuotaEdit } from "@/lib/demo/parse-campaigns";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

/** PUT: set the credit quota (tenant admin); idempotent by value, so it carries no key. */
export const PUT = withParams<{ campaignId: string }>(
  async ({ req, sessionId }, { campaignId }) => {
    if (!isSafeId(campaignId)) return invalidId();
    const body = parseQuotaEdit(await readJson(req));
    if (!body) return validationError("The quota or reason is invalid.");
    return proxy(`/v1/campaigns/${campaignId}/quota`, { method: "PUT", body, sessionId });
  },
);
