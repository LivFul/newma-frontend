import { withSession } from "@/lib/demo/bff";
import { proxy } from "@/lib/demo/proxy";

/** GET: the fictional beneficiaries and their received demo credits (A24). */
export const GET = withSession(({ sessionId }) => proxy("/v1/beneficiaries", { sessionId }));
