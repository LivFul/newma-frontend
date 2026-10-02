import { clearSessionCookie, seeOther, withDemo } from "@/lib/demo/bff";

/** GET: the /demo layout lands here on a backend 401; clears the cookie, then on to /access. */
export const GET = withDemo(async (_req, secure) =>
  clearSessionCookie(seeOther("/access?reason=expired"), secure),
);
