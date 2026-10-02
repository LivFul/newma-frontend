import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/demo/sessions/expired/route";
import { armBff, bffRequest, disarmBff, setCookieHeader } from "./bff-helpers";

describe("GET /api/demo/sessions/expired", () => {
  afterEach(disarmBff);

  it("clears the cookie and redirects to /access?reason=expired", async () => {
    const fetchMock = armBff([]);
    const response = await GET(bffRequest("/api/demo/sessions/expired", { https: true }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3100/access?reason=expired");
    expect(setCookieHeader(response)).toMatch(/^__Host-newma_demo_sid=;.*Max-Age=0/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await GET(bffRequest("/api/demo/sessions/expired"))).status).toBe(404);
  });
});
