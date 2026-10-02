import { isPersonaId } from "@/lib/personas";
import { demoFetch } from "@/lib/demo/api";
import { errorJson, noStore, readJson, withSession } from "@/lib/demo/bff";

/** POST {persona}: switch the current session's persona. */
export const POST = withSession(async ({ req, sessionId }) => {
  const body = (await readJson(req)) as { persona?: unknown } | undefined;
  const persona = body?.persona;
  if (!isPersonaId(persona)) return errorJson(400, "invalid_persona", "Unknown persona.");
  const { data } = await demoFetch("/v1/demo/sessions/current/persona", {
    method: "POST",
    body: { persona },
    sessionId,
  });
  return noStore(data);
});
