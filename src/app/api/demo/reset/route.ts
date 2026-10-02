import { demoFetch } from "@/lib/demo/api";
import { noStore, withSession } from "@/lib/demo/bff";

/** POST: reset the session's tenant to the synthetic seed. */
export const POST = withSession(async ({ sessionId }) => {
  const { data } = await demoFetch("/v1/demo/reset", { method: "POST", sessionId });
  return noStore(data);
});
