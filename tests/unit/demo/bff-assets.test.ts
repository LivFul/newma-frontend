import { afterEach, describe, expect, it } from "vitest";
import { GET as EVIDENCE } from "@/app/api/demo/assets/[assetId]/evidence/route";
import { SID, armBff, bffRequest, disarmBff, sentHeaders, sentUrl } from "./bff-helpers";

const ASSET = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (assetId: string) => ({ params: Promise.resolve({ assetId }) });

const row = (status: "disclosed" | "withheld", value: unknown) => ({
  path: "s.f",
  section: "s",
  label: "F",
  status,
  value,
  withheld_reason: null,
  synthetic: true,
});

describe("W8 evidence pack BFF", () => {
  afterEach(disarmBff);

  it("reads the pack with X-Demo-Session, no-store and the validated query", async () => {
    const fetchMock = armBff([Response.json({ asset_id: ASSET, fields: [] })]);
    const response = await EVIDENCE(
      bffRequest(`/api/demo/assets/${ASSET}/evidence?stage=H1&purpose=commercial`),
      ctx(ASSET),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(
      `https://api.example/v1/assets/${ASSET}/evidence?stage=H1&purpose=commercial`,
    );
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("rejects an unsafe asset id and an invalid stage or purpose before the backend", async () => {
    const fetchMock = armBff([]);
    expect((await EVIDENCE(bffRequest("/x"), ctx("../demo/reset"))).status).toBe(400);
    expect((await EVIDENCE(bffRequest("/x?stage=H9"), ctx(ASSET))).status).toBe(422);
    expect((await EVIDENCE(bffRequest("/x?purpose=disclosure"), ctx(ASSET))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("nulls the value of a hostile upstream withheld row and keeps disclosed ones", async () => {
    armBff([
      Response.json({ asset_id: ASSET, fields: [row("withheld", "LEAK"), row("disclosed", "ok")] }),
    ]);
    const body = (await (await EVIDENCE(bffRequest("/x"), ctx(ASSET))).json()) as {
      fields: { value: unknown }[];
    };
    expect(body.fields.map((f) => f.value)).toEqual([null, "ok"]);
  });

  it("passes 403 persona_forbidden with details and 404 asset_not_found", async () => {
    armBff([
      Response.json(
        {
          code: "persona_forbidden",
          message: "no",
          details: { persona: "scientist", allowed: ["partner", "tenant_admin"], secret: 1 },
        },
        { status: 403 },
      ),
      Response.json(
        { code: "asset_not_found", message: "none", details: { x: 1 } },
        { status: 404 },
      ),
    ]);
    const forbidden = await EVIDENCE(bffRequest("/x"), ctx(ASSET));
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({
      code: "persona_forbidden",
      message: "no",
      details: { persona: "scientist", allowed: ["partner", "tenant_admin"] },
    });
    const missing = await EVIDENCE(bffRequest("/x"), ctx(ASSET));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ code: "asset_not_found", message: "none" });
  });

  it("answers 401 without a session cookie", async () => {
    armBff([]);
    expect((await EVIDENCE(bffRequest("/x", { cookie: false }), ctx(ASSET))).status).toBe(401);
  });
});
