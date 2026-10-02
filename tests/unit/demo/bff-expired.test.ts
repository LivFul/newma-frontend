import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/demo/sessions/expired/route";
import {
  SID,
  armBff,
  bffRequest,
  disarmBff,
  envelope,
  sentHeaders,
  sentUrl,
  setCookieHeader,
} from "./bff-helpers";

const current = () =>
  Response.json({ persona: "finance", tenant_id: "t", expires_at: "x", created_at: "y" });

describe("GET /api/demo/sessions/expired", () => {
  afterEach(disarmBff);

  it.each(["invalid_session", "session_expired"])(
    "clears the cookie and redirects to /access?reason=expired when the backend says %s",
    async (code) => {
      const fetchMock = armBff([envelope(code, 401)]);
      const response = await GET(bffRequest("/api/demo/sessions/expired", { https: true }));
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/access?reason=expired");
      expect(setCookieHeader(response)).toMatch(/^__Host-newma_demo_sid=;.*Max-Age=0/);
      expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/sessions/current");
      expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    },
  );

  it("keeps a session the backend still accepts and sends the browser back to /demo", async () => {
    armBff([current()]);
    const response = await GET(bffRequest("/api/demo/sessions/expired"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/demo");
    expect(setCookieHeader(response)).toBe("");
  });

  it("does not clear the cookie on a backend 5xx; sends the browser to /access", async () => {
    armBff([envelope("db_down", 503)]);
    const response = await GET(bffRequest("/api/demo/sessions/expired"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/access");
    expect(setCookieHeader(response)).toBe("");
  });

  it("redirects to /access without a backend call when there is no cookie", async () => {
    const fetchMock = armBff([]);
    const response = await GET(bffRequest("/api/demo/sessions/expired", { cookie: false }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/access");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores a cross-site navigation: 303 to /access, cookie untouched, no backend call", async () => {
    const fetchMock = armBff([]);
    const response = await GET(
      bffRequest("/api/demo/sessions/expired", { https: true, fetchSite: "cross-site" }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/access");
    expect(setCookieHeader(response)).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await GET(bffRequest("/api/demo/sessions/expired"))).status).toBe(404);
  });
});
