import { isSafeId } from "@/lib/demo/bff";
import { invalidId, proxy, withParams } from "@/lib/demo/proxy";

/** GET: spent, reserved and remaining credits with the newest jobs (any persona). */
export const GET = withParams<{ campaignId: string }>(async ({ sessionId }, { campaignId }) => {
  if (!isSafeId(campaignId)) return invalidId();
  return proxy(`/v1/campaigns/${campaignId}/credit-usage`, { sessionId });
});
