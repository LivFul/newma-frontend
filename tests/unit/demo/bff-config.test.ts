import { afterEach, describe, expect, it } from "vitest";
import { GET, PUT } from "@/app/api/demo/config/route";
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
} from "./bff-helpers";

const config = {
  speed_factor: 4,
  server_speed_factor: 4,
  speed_source: "server_default",
  min_speed_factor: 1,
  max_speed_factor: 10,
};

describe("GET /api/demo/config", () => {
  afterEach(disarmBff);

  it("reads the effective speed through the session, no-store", async () => {
    const fetchMock = armBff([Response.json(config)]);
    const response = await GET(bffRequest("/api/demo/config"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(config);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/config");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    expect(sentHeaders(fetchMock).get("authorization")).toBe(`Bearer ${TOKEN}`);
  });

  it("forwards only the documented config fields", async () => {
    armBff([Response.json({ ...config, tenant_id: "t", debug: { x: 1 } })]);
    const response = await GET(bffRequest("/api/demo/config"));
    expect(await response.json()).toEqual(config);
  });

  it("answers 502 when the upstream body is not a config", async () => {
    armBff([Response.json(null)]);
    expect((await GET(bffRequest("/api/demo/config"))).status).toBe(502);
    disarmBff();
    armBff([Response.json({ ...config, speed_factor: { a: 1 } })]);
    expect((await GET(bffRequest("/api/demo/config"))).status).toBe(502);
  });

  it("needs a session and the demo switched on", async () => {
    armBff([]);
    expect((await GET(bffRequest("/api/demo/config", { cookie: false }))).status).toBe(401);
    disarmBff();
    armBff([], false);
    expect((await GET(bffRequest("/api/demo/config"))).status).toBe(404);
  });

  it("maps an upstream 5xx to a generic 502 without leaking the body", async () => {
    armBff([new Response("boom internal detail", { status: 500 })]);
    const response = await GET(bffRequest("/api/demo/config"));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("internal detail");
  });
});

describe("PUT /api/demo/config", () => {
  afterEach(disarmBff);

  it.each([[1], [4], [10], [7.5]])("forwards the speed %s", async (speed) => {
    const fetchMock = armBff([Response.json({ ...config, speed_factor: speed })]);
    const response = await PUT(
      bffRequest("/api/demo/config", { method: "PUT", json: { speed_factor: speed } }),
    );
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/config");
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(sentBody(fetchMock)).toEqual({ speed_factor: speed });
  });

  it("forwards null to clear the override", async () => {
    const fetchMock = armBff([Response.json(config)]);
    await PUT(bffRequest("/api/demo/config", { method: "PUT", json: { speed_factor: null } }));
    expect(sentBody(fetchMock)).toEqual({ speed_factor: null });
  });

  it("forwards only speed_factor, dropping extra fields", async () => {
    const fetchMock = armBff([Response.json(config)]);
    await PUT(
      bffRequest("/api/demo/config", {
        method: "PUT",
        json: { speed_factor: 2, tenant_id: "other", extra: true },
      }),
    );
    expect(sentBody(fetchMock)).toEqual({ speed_factor: 2 });
  });

  it.each([
    ["zero", { speed_factor: 0 }],
    ["eleven", { speed_factor: 11 }],
    ["negative", { speed_factor: -1 }],
    ["a string", { speed_factor: "4" }],
    ["missing", {}],
    ["not an object", [4]],
  ])("rejects %s with 422 before reaching the API", async (_name, body) => {
    const fetchMock = armBff([]);
    const response = await PUT(bffRequest("/api/demo/config", { method: "PUT", json: body }));
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("validation_error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type with 415", async () => {
    const fetchMock = armBff([]);
    const text = await PUT(
      bffRequest("/api/demo/config", { method: "PUT", contentType: "text/plain" }),
    );
    expect(text.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses cross-site writes", async () => {
    const fetchMock = armBff([]);
    const response = await PUT(
      bffRequest("/api/demo/config", {
        method: "PUT",
        json: { speed_factor: 3 },
        fetchSite: "cross-site",
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("needs a session", async () => {
    armBff([]);
    const response = await PUT(
      bffRequest("/api/demo/config", { method: "PUT", json: { speed_factor: 3 }, cookie: false }),
    );
    expect(response.status).toBe(401);
  });

  it("passes the API's own 422 through without details", async () => {
    armBff([envelope("validation_error", 422)]);
    const response = await PUT(
      bffRequest("/api/demo/config", { method: "PUT", json: { speed_factor: 3 } }),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "validation_error",
      message: "validation_error message",
    });
  });
});
