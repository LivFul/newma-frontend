import { demoFetch } from "@/lib/demo/api";
import { noStore, withSession } from "@/lib/demo/bff";

/** GET: the current demo session (persona, tenant, expiry). */
export const GET = withSession(async ({ sessionId }) => {
  const { data } = await demoFetch("/v1/demo/sessions/current", { sessionId });
  return noStore(data);
});
