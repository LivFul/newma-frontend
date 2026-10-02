import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/client";

describe("createApiClient", () => {
  afterEach(() => vi.restoreAllMocks());
  it("sends service token and session headers to the base URL", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ status: "ok", version: "0.1.0-demo" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
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
});
