import { afterEach, describe, expect, it } from "vitest";
import { GET as LIST, POST as CREATE } from "@/app/api/demo/rights/records/route";
import { GET as ONE } from "@/app/api/demo/rights/records/[id]/route";
import { POST as WITHDRAW } from "@/app/api/demo/rights/records/[id]/withdraw/route";
import { POST as EVALUATE } from "@/app/api/demo/policy/evaluate/route";
import { GET as CACHE } from "@/app/api/demo/retrieval/cache/route";
import { SID, armBff, bffRequest, disarmBff, sentBody, sentHeaders, sentUrl } from "./bff-helpers";

const RID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const forbidden = () =>
  Response.json(
    {
      code: "persona_forbidden",
      message: "Persona not allowed.",
      details: { persona: "scientist", allowed: ["community_liaison"] },
    },
    { status: 403 },
  );
const evaluation = { purpose: "research", action: "retrieve", asset_type: "taxon", asset_id: RID };

describe("W1 rights BFF", () => {
  afterEach(disarmBff);

  it("lists records with X-Demo-Session and no-store", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    const response = await LIST(bffRequest("/api/demo/rights/records"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/rights/records");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("gets one record and rejects an unsafe id", async () => {
    const fetchMock = armBff([Response.json({ id: RID })]);
    expect((await ONE(bffRequest("/x"), ctx(RID))).status).toBe(200);
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/rights/records/${RID}`);
    expect((await ONE(bffRequest("/x"), ctx("../demo/reset"))).status).toBe(400);
  });

  it("creates a record with a validated body (201)", async () => {
    const body = {
      subject_type: "taxon",
      subject_id: RID,
      authority: "Community Cooperative A — fictional",
      permitted_uses: ["research"],
      restrictions: [],
      jurisdiction: "XX",
      valid_from: "2026-01-01",
      extra: "dropped",
    };
    const fetchMock = armBff([Response.json({ id: "r" }, { status: 201 })]);
    const response = await CREATE(bffRequest("/x", { method: "POST", json: body }));
    expect(response.status).toBe(201);
    const { extra, ...forwarded } = body;
    void extra;
    expect(sentBody(fetchMock)).toEqual(forwarded);
  });

  const validRecord = {
    subject_type: "taxon",
    subject_id: RID,
    authority: "Community Cooperative A — fictional",
    permitted_uses: ["research"],
    restrictions: ["no_commercial_use"],
    jurisdiction: "XX",
    valid_from: "2026-01-01",
  };

  it.each([
    ["an over-long authority", { authority: "a".repeat(201) }],
    ["an over-long jurisdiction", { jurisdiction: "j".repeat(65) }],
    ["too many restrictions", { restrictions: Array.from({ length: 21 }, (_, i) => `r${i}`) }],
    ["an over-long restriction", { restrictions: ["r".repeat(121)] }],
    ["duplicate permitted uses", { permitted_uses: ["research", "research"] }],
    ["an empty permitted_uses", { permitted_uses: [] }],
    ["valid_from that is not an ISO date", { valid_from: "01/01/2026" }],
    ["valid_from that is not a real date", { valid_from: "2026-02-31" }],
    ["valid_until that is not an ISO date", { valid_until: "soon" }],
    ["an over-long PIC reference", { pic_reference: "p".repeat(81) }],
  ])("rejects %s", async (_label, patch) => {
    const fetchMock = armBff([]);
    const response = await CREATE(
      bffRequest("/x", { method: "POST", json: { ...validRecord, ...patch } }),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a valid_until ISO date and null-free optional references", async () => {
    const fetchMock = armBff([Response.json({ id: "r" }, { status: 201 })]);
    const body = { ...validRecord, valid_until: "2027-12-31", pic_reference: "PIC-DEMO-1" };
    expect((await CREATE(bffRequest("/x", { method: "POST", json: body }))).status).toBe(201);
    expect(sentBody(fetchMock)).toEqual(body);
  });

  it("caps the withdrawal reason and the evaluation jurisdiction", async () => {
    const fetchMock = armBff([]);
    const long = await WITHDRAW(
      bffRequest("/x", { method: "POST", json: { reason: "r".repeat(2001) } }),
      ctx(RID),
    );
    expect(long.status).toBe(422);
    const jurisdiction = await EVALUATE(
      bffRequest("/x", { method: "POST", json: { ...evaluation, jurisdiction: "j".repeat(65) } }),
    );
    expect(jurisdiction.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a record with an unknown purpose", async () => {
    const fetchMock = armBff([]);
    const response = await CREATE(
      bffRequest("/x", {
        method: "POST",
        json: {
          subject_type: "taxon",
          subject_id: RID,
          authority: "a",
          permitted_uses: ["mining"],
          restrictions: [],
          jurisdiction: "XX",
          valid_from: "2026-01-01",
        },
      }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("validation_error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("withdraws with a reason and passes persona_forbidden details", async () => {
    const fetchMock = armBff([forbidden()]);
    const response = await WITHDRAW(
      bffRequest("/x", { method: "POST", json: { reason: "Consent withdrawn by the community" } }),
      ctx(RID),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "persona_forbidden",
      message: "Persona not allowed.",
      details: { persona: "scientist", allowed: ["community_liaison"] },
    });
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/rights/records/${RID}/withdraw`);
  });

  it("rejects a withdrawal without a reason", async () => {
    const fetchMock = armBff([]);
    const response = await WITHDRAW(
      bffRequest("/x", { method: "POST", json: { reason: " " } }),
      ctx(RID),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a cross-site POST before reaching the backend", async () => {
    const fetchMock = armBff([]);
    const response = await EVALUATE(
      bffRequest("/x", { method: "POST", json: evaluation, fetchSite: "cross-site" }),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("cross_site_request");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("evaluates policy with the validated inputs only", async () => {
    const fetchMock = armBff([Response.json({ decision: "allow" })]);
    const response = await EVALUATE(
      bffRequest("/x", { method: "POST", json: { ...evaluation, persona: "tenant_admin" } }),
    );
    expect(response.status).toBe(200);
    expect(sentBody(fetchMock)).toEqual(evaluation);
  });

  it.each([
    { ...evaluation, purpose: "mining" },
    { ...evaluation, action: "steal" },
    { ...evaluation, asset_type: "person" },
    { ...evaluation, asset_id: "" },
    { ...evaluation, jurisdiction: 3 },
  ])("rejects evaluation body %j", async (body) => {
    const fetchMock = armBff([]);
    expect((await EVALUATE(bffRequest("/x", { method: "POST", json: body }))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists cache entries for a UUID subject and rejects anything else", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    const ok = await CACHE(bffRequest(`/api/demo/retrieval/cache?subject_id=${RID}`));
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/retrieval/cache?subject_id=${RID}`);
    const bad = await CACHE(bffRequest("/api/demo/retrieval/cache?subject_id=x;drop"));
    expect(bad.status).toBe(422);
    const all = armBff([Response.json({ items: [] })]);
    await CACHE(bffRequest("/api/demo/retrieval/cache"));
    expect(sentUrl(all)).toBe("https://api.example/v1/retrieval/cache");
  });
});
