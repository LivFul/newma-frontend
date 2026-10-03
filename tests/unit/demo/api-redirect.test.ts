import { afterEach, describe, expect, it } from "vitest";
import { demoApi, demoFetch } from "@/lib/demo/api";
import { armBff, disarmBff } from "./bff-helpers";

// The service token rides on these requests: a redirect must be an error, never followed.
describe("backend calls never follow redirects", () => {
  afterEach(disarmBff);

  it("demoFetch sets redirect: error", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    await demoFetch("/v1/jobs", { sessionId: "s" });
    expect(fetchMock.mock.calls[0][1].redirect).toBe("error");
  });

  it("the openapi-fetch client sets redirect: error", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    await demoApi("s").GET("/v1/jobs");
    const request = fetchMock.mock.calls[0][0] as unknown as Request;
    expect(request.redirect).toBe("error");
  });
});
