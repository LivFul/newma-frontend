import { withSession } from "@/lib/demo/bff";
import { proxy } from "@/lib/demo/proxy";

/** GET: retraining proposals, all blocked pending separate authorization (IP C-04). */
export const GET = withSession(async ({ sessionId }) =>
  proxy("/v1/retraining-proposals", { sessionId }),
);
