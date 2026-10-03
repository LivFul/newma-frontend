import { withSession } from "@/lib/demo/bff";
import { proxy } from "@/lib/demo/proxy";

/** GET: ranked candidates with their current gate stage. */
export const GET = withSession(async ({ sessionId }) => proxy("/v1/candidates", { sessionId }));
