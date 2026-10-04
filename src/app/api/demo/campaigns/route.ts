import { withSession } from "@/lib/demo/bff";
import { proxy } from "@/lib/demo/proxy";

/** GET: the tenant's campaigns with quota, committed and remaining credits (any persona). */
export const GET = withSession(async ({ sessionId }) => proxy("/v1/campaigns", { sessionId }));
