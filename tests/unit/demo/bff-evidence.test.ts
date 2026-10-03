import { afterEach, describe, expect, it } from "vitest";
import { GET as TAXA } from "@/app/api/demo/taxa/route";
import { GET as COMPOUNDS } from "@/app/api/demo/compounds/route";
import { GET as OBSERVATIONS } from "@/app/api/demo/observations/route";
import { armBff, bffRequest, disarmBff, sentHeaders, sentUrl, SID } from "./bff-helpers";

const CID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";

describe("W2 evidence BFF", () => {
  afterEach(disarmBff);

  it("forwards the opaque cursor and limit with no-store", async () => {
    const fetchMock = armBff([Response.json({ items: [], next_cursor: null })]);
    const response = await TAXA(bffRequest("/api/demo/taxa?cursor=eyJrIjoiYSJ9&limit=10&junk=1"));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/taxa?cursor=eyJrIjoiYSJ9&limit=10");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("accepts a long opaque cursor (backend keys reach ~2 KB) but not a huge one", async () => {
    const fetchMock = armBff([Response.json({ items: [], next_cursor: null })]);
    const long = "a".repeat(2200);
    expect((await TAXA(bffRequest(`/api/demo/taxa?cursor=${long}`))).status).toBe(200);
    expect(sentUrl(fetchMock)).toContain(long);
    expect((await TAXA(bffRequest(`/api/demo/taxa?cursor=${"a".repeat(4097)}`))).status).toBe(422);
  });

  it("lists compounds without a query", async () => {
    const fetchMock = armBff([Response.json({ items: [], next_cursor: null })]);
    await COMPOUNDS(bffRequest("/api/demo/compounds"));
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/compounds");
  });

  it("forwards observation filters after validation", async () => {
    const fetchMock = armBff([Response.json({ items: [], next_cursor: null })]);
    await OBSERVATIONS(
      bffRequest(`/api/demo/observations?compound_id=${CID}&evidence_label=measured_observation`),
    );
    expect(sentUrl(fetchMock)).toBe(
      `https://api.example/v1/observations?compound_id=${CID}&evidence_label=measured_observation`,
    );
  });

  it.each([
    "/api/demo/observations?limit=0",
    "/api/demo/observations?limit=101",
    "/api/demo/observations?limit=ten",
    "/api/demo/observations?cursor=a%20b",
    "/api/demo/observations?compound_id=DEMO-C-001",
    "/api/demo/observations?evidence_label=predicted",
  ])("rejects %s with 422 before the backend", async (url) => {
    const fetchMock = armBff([]);
    const response = await OBSERVATIONS(bffRequest(url));
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a backend invalid_cursor without its details", async () => {
    armBff([
      Response.json(
        { code: "invalid_cursor", message: "Bad cursor.", details: { cursor: "x" } },
        { status: 422 },
      ),
    ]);
    const response = await TAXA(bffRequest("/api/demo/taxa?cursor=abc"));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: "invalid_cursor", message: "Bad cursor." });
  });
});
