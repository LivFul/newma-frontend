import { afterEach, describe, expect, it } from "vitest";
import { GET as LIST } from "@/app/api/demo/grievances/route";
import { POST as ACK } from "@/app/api/demo/grievances/[grievanceId]/acknowledge/route";
import { SID, armBff, bffRequest, disarmBff, sentBody, sentHeaders, sentUrl } from "./bff-helpers";

const GRV = "7d1c2b3a-0000-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (grievanceId: string) => ({ params: Promise.resolve({ grievanceId }) });

describe("grievance queue BFF", () => {
  afterEach(disarmBff);

  it("lists grievances with validated filters, no-store and the session header", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    const response = await LIST(
      bffRequest("/api/demo/grievances?status=open&rights_record_id=rec-1"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(
      "https://api.example/v1/grievances?status=open&rights_record_id=rec-1",
    );
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("rejects an unknown status or an unsafe record id before the backend", async () => {
    const fetchMock = armBff([]);
    expect((await LIST(bffRequest("/x?status=closed"))).status).toBe(422);
    expect((await LIST(bffRequest("/x?rights_record_id=../x"))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes persona_forbidden with details for a persona outside the allowed set", async () => {
    armBff([
      Response.json(
        {
          code: "persona_forbidden",
          message: "no",
          details: {
            persona: "partner",
            allowed: ["community_liaison", "data_steward", "tenant_admin"],
            x: 1,
          },
        },
        { status: 403 },
      ),
    ]);
    const response = await LIST(bffRequest("/x"));
    expect(response.status).toBe(403);
    expect((await response.json()).details).toEqual({
      persona: "partner",
      allowed: ["community_liaison", "data_steward", "tenant_admin"],
    });
  });

  it("acknowledges with an empty JSON body and forwards 200", async () => {
    const fetchMock = armBff([Response.json({ id: GRV, status: "acknowledged" })]);
    const response = await ACK(bffRequest("/x", { method: "POST", json: {} }), ctx(GRV));
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/grievances/${GRV}/acknowledge`);
    expect(sentBody(fetchMock)).toEqual({});
  });

  it("acknowledges even when the browser sends no body", async () => {
    armBff([Response.json({ id: GRV, status: "acknowledged" })]);
    const response = await ACK(bffRequest("/x", { method: "POST" }), ctx(GRV));
    expect(response.status).toBe(200);
  });

  it("forwards 409 grievance_already_acknowledged without details", async () => {
    armBff([
      Response.json(
        { code: "grievance_already_acknowledged", message: "Done.", details: { secret: 1 } },
        { status: 409 },
      ),
    ]);
    const response = await ACK(bffRequest("/x", { method: "POST", json: {} }), ctx(GRV));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "grievance_already_acknowledged",
      message: "Done.",
    });
  });

  it("rejects an unsafe id and a cross-site post", async () => {
    armBff([]);
    expect((await ACK(bffRequest("/x", { method: "POST" }), ctx("../x"))).status).toBe(400);
    const cross = await ACK(
      bffRequest("/x", { method: "POST", fetchSite: "cross-site" }),
      ctx(GRV),
    );
    expect(cross.status).toBe(403);
  });
});
