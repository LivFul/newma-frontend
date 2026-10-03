import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/demo/grievances/route";
import { armBff, bffRequest, disarmBff, envelope, sentBody, sentUrl } from "./bff-helpers";

const REC = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const GRV = "7d1c2b3a-0000-4b6c-9e8f-0a1b2c3d4e5f";
const DESCRIPTION = "The promised annual report did not arrive; SECRET-TEXT-123";
const form = {
  rights_record_id: REC,
  obligation_id: "",
  category: "obligation_not_met",
  description: DESCRIPTION,
  idempotency_key: "k-1",
};
const post = (fields: Record<string, string>, extra = {}) =>
  POST(bffRequest("/api/demo/grievances", { method: "POST", form: fields, ...extra }));

describe("W10 grievance form handler", () => {
  afterEach(disarmBff);

  it("creates the grievance from the form and redirects 303 to the page with its id", async () => {
    const fetchMock = armBff([Response.json({ id: GRV }, { status: 201 })]);
    const response = await post(form);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`/demo/w10-custodian?raised=${GRV}`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/grievances");
    expect(sentBody(fetchMock)).toEqual({
      rights_record_id: REC,
      category: "obligation_not_met",
      description: DESCRIPTION,
      idempotency_key: "k-1",
    });
  });

  it("passes the optional obligation id", async () => {
    const fetchMock = armBff([Response.json({ id: GRV }, { status: 201 })]);
    await post({ ...form, obligation_id: "ob-1" });
    expect(sentBody(fetchMock)).toMatchObject({ obligation_id: "ob-1" });
  });

  it("redirects a replay (200) like a success", async () => {
    armBff([
      Response.json({ id: GRV }, { status: 200, headers: { "Idempotent-Replayed": "true" } }),
    ]);
    const response = await post(form);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("raised=");
  });

  it("never puts the description in the Location, on success or failure", async () => {
    armBff([Response.json({ id: GRV }, { status: 201 }), envelope("persona_forbidden", 403)]);
    const ok = await post(form);
    const bad = await post(form);
    for (const response of [ok, bad]) {
      const location = response.headers.get("location") ?? "";
      expect(location).not.toContain("SECRET");
      expect(decodeURIComponent(location)).not.toContain("annual report");
    }
  });

  it.each([
    ["persona_forbidden", 403],
    ["validation_error", 422],
    ["not_found", 404],
    ["idempotency_conflict", 409],
  ])(
    "redirects a %s failure with an allow-listed error code and no description",
    async (code, status) => {
      armBff([envelope(code, status)]);
      const response = await post(form);
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(`/demo/w10-custodian?error=${code}`);
    },
  );

  it("maps an unlisted backend code and a 5xx to upstream_error", async () => {
    armBff([envelope("something_new", 409), envelope("boom", 500)]);
    expect((await post(form)).headers.get("location")).toBe(
      "/demo/w10-custodian?error=upstream_error",
    );
    expect((await post(form)).headers.get("location")).toBe(
      "/demo/w10-custodian?error=upstream_error",
    );
  });

  it("redirects a network failure to upstream_error", async () => {
    armBff([]); // the empty queue makes the mocked fetch throw
    const response = await post(form);
    expect(response.headers.get("location")).toBe("/demo/w10-custodian?error=upstream_error");
  });

  it("redirects an empty or short description to validation_error without calling the backend", async () => {
    const fetchMock = armBff([]);
    for (const description of ["", "too short", "   "]) {
      const response = await post({ ...form, description });
      expect(response.headers.get("location")).toBe("/demo/w10-custodian?error=validation_error");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("omits a raised id that is not a safe id", async () => {
    armBff([Response.json({ id: "../evil?x=1" }, { status: 201 })]);
    const response = await post(form);
    expect(response.headers.get("location")).toBe("/demo/w10-custodian?raised=1");
  });

  it("refuses a cross-site post with 403 and an oversize body with 413", async () => {
    armBff([]);
    expect((await post(form, { fetchSite: "cross-site" })).status).toBe(403);
    const big = await post({ ...form, description: "x".repeat(300 * 1024) });
    expect(big.status).toBe(413);
  });

  it("answers 415 to a JSON body and 401 without a session", async () => {
    armBff([]);
    const json = await POST(bffRequest("/x", { method: "POST", json: form }));
    expect(json.status).toBe(415);
    expect((await post(form, { cookie: false })).status).toBe(401);
  });
});
