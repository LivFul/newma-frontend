import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/server";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const mockFetch = (response: Response) =>
  vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () => response);

const apiDir = path.resolve(__dirname, "../../src/lib/api");

describe("createApiClient", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends service token and session headers to the base URL", async () => {
    const fetchMock = mockFetch(jsonResponse({ status: "ok", version: "0.1.0-demo" }, 200));
    const client = createApiClient({
      baseUrl: "https://api.example",
      serviceToken: "t0k",
      sessionId: "s1",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const { data, response } = await client.GET("/healthz");
    expect(response.status).toBe(200);
    expect(data?.status).toBe("ok");
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.url).toBe("https://api.example/healthz");
    expect(req.headers.get("authorization")).toBe("Bearer t0k");
    expect(req.headers.get("x-demo-session")).toBe("s1");
  });

  it("omits the X-Demo-Session header when no session is given", async () => {
    const fetchMock = mockFetch(jsonResponse({ status: "ok", version: "0.1.0-demo" }, 200));
    const client = createApiClient({
      baseUrl: "https://api.example",
      serviceToken: "t0k",
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.GET("/healthz");
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.headers.has("x-demo-session")).toBe(false);
    expect(req.headers.get("authorization")).toBe("Bearer t0k");
  });

  it("returns error and no data on a non-2xx response", async () => {
    const fetchMock = mockFetch(jsonResponse({ detail: "upstream unavailable" }, 503));
    const client = createApiClient({
      baseUrl: "https://api.example",
      serviceToken: "t0k",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const { data, error, response } = await client.GET("/healthz");
    expect(response.status).toBe(503);
    expect(data).toBeUndefined();
    expect(error).toEqual({ detail: "upstream unavailable" });
  });
});

describe("api barrels", () => {
  it("keeps the client factory server-only", () => {
    const client = readFileSync(path.join(apiDir, "client.ts"), "utf8");
    expect(client.startsWith('import "server-only";')).toBe(true);
  });
  it("exports only types from the client-safe index barrel", () => {
    const index = readFileSync(path.join(apiDir, "index.ts"), "utf8");
    const exportLines = index.split("\n").filter((line) => line.startsWith("export"));
    expect(exportLines.length).toBeGreaterThan(0);
    for (const line of exportLines) expect(line).toMatch(/^export type /);
  });
});
