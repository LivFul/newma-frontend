import { withSession } from "@/lib/demo/bff";
import { proxy } from "@/lib/demo/proxy";

/** GET: agreements, licensee organizations and the simulator's fictional credential references. */
export const GET = withSession(({ sessionId }) => proxy("/v1/licenses/options", { sessionId }));
