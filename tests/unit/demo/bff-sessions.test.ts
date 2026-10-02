import { afterEach, describe, expect, it } from "vitest";
import { DELETE, POST } from "@/app/api/demo/sessions/route";
import { POST as SWITCH } from "@/app/api/demo/sessions/persona/route";
import { GET as ME } from "@/app/api/demo/me/route";
import { POST as RESET } from "@/app/api/demo/reset/route";
import {
  SID,
  TOKEN,
  armBff,
  bffRequest,
  disarmBff,
  envelope,
  sentBody,
  sentHeaders,
  sentUrl,
  setCookieHeader,
} from "./bff-helpers";

const created = () =>
  Response.json(
    {
      session_id: "new-sid",
      persona: "scientist",
      tenant_id: "t-1",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    },
    { status: 201 },
  );

const current = () =>
  Response.json({
    persona: "finance",
    tenant_id: "t-1",
    expires_at: "2030-01-01T00:00:00Z",
    created_at: "2029-12-31T00:00:00Z",
  });

describe("POST /api/demo/sessions", () => {
  afterEach(disarmBff);

  it("creates a session over https and sets the __Host- HttpOnly Secure cookie", async () => {
    const fetchMock = armBff([created()]);
    const response = await POST(
      bffRequest("/api/demo/sessions", {
        method: "POST",
        https: true,
        cookie: false,
        json: { persona: "scientist" },
      }),
    );
    expect(response.status).toBe(201);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/sessions");
    expect(sentBody(fetchMock)).toEqual({ persona: "scientist" });
    expect(sentHeaders(fetchMock).get("authorization")).toBe(`Bearer ${TOKEN}`);
    const cookie = setCookieHeader(response);
    expect(cookie).toMatch(/^__Host-newma_demo_sid=new-sid;/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=\d+/);
    const body = await response.json();
    expect(body).toEqual({
      persona: "scientist",
      tenant_id: "t-1",
      expires_at: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain("new-sid");
  });

  it("uses the dev cookie name without Secure on plain http", async () => {
    armBff([created()]);
    const response = await POST(
      bffRequest("/api/demo/sessions", {
        method: "POST",
        cookie: false,
        json: { persona: "scientist" },
      }),
    );
    const cookie = setCookieHeader(response);
    expect(cookie).toMatch(/^newma_demo_sid=new-sid;/);
    expect(cookie).not.toMatch(/Secure/);
  });

  it("answers a form post with a 303 to /demo", async () => {
    armBff([created()]);
    const response = await POST(
      bffRequest("/api/demo/sessions", {
        method: "POST",
        cookie: false,
        form: { persona: "scientist" },
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3100/demo");
    expect(setCookieHeader(response)).toMatch(/^newma_demo_sid=new-sid;/);
  });

  it("rejects an unknown persona: 400 for JSON, 303 to /access?reason=invalid for forms", async () => {
    const fetchMock = armBff([]);
    const json = await POST(
      bffRequest("/api/demo/sessions", { method: "POST", json: { persona: "root" } }),
    );
    expect(json.status).toBe(400);
    expect((await json.json()).code).toBe("invalid_persona");
    const form = await POST(
      bffRequest("/api/demo/sessions", { method: "POST", form: { persona: "root" } }),
    );
    expect(form.status).toBe(303);
    expect(form.headers.get("location")).toBe("http://localhost:3100/access?reason=invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a backend failure to its status without leaking the service token", async () => {
    armBff([envelope("rate_limited", 429)]);
    const response = await POST(
      bffRequest("/api/demo/sessions", { method: "POST", json: { persona: "scientist" } }),
    );
    expect(response.status).toBe(429);
    const text = await response.text();
    expect(text).toContain("rate_limited");
    expect(text).not.toContain(TOKEN);
  });

  it("returns 404 when demo mode is off", async () => {
    const fetchMock = armBff([], false);
    const response = await POST(
      bffRequest("/api/demo/sessions", { method: "POST", json: { persona: "scientist" } }),
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/demo/sessions", () => {
  afterEach(disarmBff);

  it("tells the backend, clears the cookie and answers 204", async () => {
    const fetchMock = armBff([new Response(null, { status: 204 })]);
    const response = await DELETE(
      bffRequest("/api/demo/sessions", { method: "DELETE", https: true }),
    );
    expect(response.status).toBe(204);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/sessions/current");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    const cookie = setCookieHeader(response);
    expect(cookie).toMatch(/^__Host-newma_demo_sid=;/);
    expect(cookie).toMatch(/Max-Age=0/);
  });

  it("still clears the cookie and answers 204 when the backend no longer knows the session", async () => {
    armBff([envelope("invalid_session", 401)]);
    const response = await DELETE(bffRequest("/api/demo/sessions", { method: "DELETE" }));
    expect(response.status).toBe(204);
    expect(setCookieHeader(response)).toMatch(/^newma_demo_sid=;.*Max-Age=0/);
  });

  it("answers 204 without calling the backend when there is no cookie", async () => {
    const fetchMock = armBff([]);
    const response = await DELETE(
      bffRequest("/api/demo/sessions", { method: "DELETE", cookie: false }),
    );
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await DELETE(bffRequest("/api/demo/sessions", { method: "DELETE" }))).status).toBe(404);
  });
});

describe("GET /api/demo/me", () => {
  afterEach(disarmBff);

  it("forwards the session and returns the current session with no-store", async () => {
    const fetchMock = armBff([current()]);
    const response = await ME(bffRequest("/api/demo/me"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/sessions/current");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    expect((await response.json()).persona).toBe("finance");
  });

  it("answers 401 without calling the backend when the cookie is missing", async () => {
    const fetchMock = armBff([]);
    const response = await ME(bffRequest("/api/demo/me", { cookie: false }));
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe("no_session");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["invalid_session", "session_expired"])(
    "clears the cookie and answers 401 when the backend says %s",
    async (code) => {
      armBff([envelope(code, 401)]);
      const response = await ME(bffRequest("/api/demo/me", { https: true }));
      expect(response.status).toBe(401);
      expect((await response.json()).code).toBe(code);
      expect(setCookieHeader(response)).toMatch(/^__Host-newma_demo_sid=;.*Max-Age=0/);
    },
  );

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await ME(bffRequest("/api/demo/me"))).status).toBe(404);
  });
});

describe("POST /api/demo/sessions/persona", () => {
  afterEach(disarmBff);

  it("forwards a valid persona switch", async () => {
    const fetchMock = armBff([current()]);
    const response = await SWITCH(
      bffRequest("/api/demo/sessions/persona", { method: "POST", json: { persona: "finance" } }),
    );
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/sessions/current/persona");
    expect(sentBody(fetchMock)).toEqual({ persona: "finance" });
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("rejects an invalid persona with 400", async () => {
    const fetchMock = armBff([]);
    const response = await SWITCH(
      bffRequest("/api/demo/sessions/persona", { method: "POST", json: { persona: "nope" } }),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    const response = await SWITCH(
      bffRequest("/api/demo/sessions/persona", { method: "POST", json: { persona: "finance" } }),
    );
    expect(response.status).toBe(404);
  });
});

describe("POST /api/demo/reset", () => {
  afterEach(disarmBff);

  it("forwards the reset and returns the counts", async () => {
    const fetchMock = armBff([Response.json({ tenant_id: "t-1", counts: { jobs: 0 } })]);
    const response = await RESET(bffRequest("/api/demo/reset", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/reset");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect((await response.json()).counts).toEqual({ jobs: 0 });
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await RESET(bffRequest("/api/demo/reset", { method: "POST" }))).status).toBe(404);
  });
});
