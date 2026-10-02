import { DemoApiError, demoFetch } from "@/lib/demo/api";
import { clearSessionCookie, seeOther, withDemo } from "@/lib/demo/bff";
import { readSessionId } from "@/lib/demo/session";

// The /demo layout lands here on a backend 401. The cookie is cleared only once the backend
// confirms the session is gone, and never on a cross-site navigation (a link elsewhere must not
// be able to sign the visitor out).
export const GET = withDemo(async (req, secure) => {
  if (req.headers.get("sec-fetch-site") === "cross-site") return seeOther("/access");
  const sessionId = readSessionId(req.cookies, secure);
  if (!sessionId) return seeOther("/access");
  try {
    await demoFetch("/v1/demo/sessions/current", { sessionId });
    return seeOther("/demo");
  } catch (error) {
    if (error instanceof DemoApiError && error.isInvalidSession) {
      return clearSessionCookie(seeOther("/access?reason=expired"), secure);
    }
    return seeOther("/access");
  }
});
