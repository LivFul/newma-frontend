import { NextResponse } from "next/server";
import { clearSessionCookie, withDemo } from "@/lib/demo/bff";

/** GET: the /demo layout lands here on a backend 401; clears the cookie, then on to /access. */
export const GET = withDemo(async (req, secure) => {
  const response = NextResponse.redirect(new URL("/access?reason=expired", req.url), 303);
  return clearSessionCookie(response, secure);
});
