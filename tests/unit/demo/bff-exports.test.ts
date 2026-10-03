import { afterEach, describe, expect, it } from "vitest";
import { GET as LIST, POST as CREATE } from "@/app/api/demo/exports/route";
import { GET as ONE } from "@/app/api/demo/exports/[exportId]/route";
import {
  SID,
  armBff,
  bffRequest,
  disarmBff,
  envelope,
  sentBody,
  sentHeaders,
  sentUrl,
} from "./bff-helpers";

const ASSET = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const EXPORT = "7d1c2b3a-0000-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (exportId: string) => ({ params: Promise.resolve({ exportId }) });
const body = {
  asset_id: ASSET,
  purpose: "research",
  recipient: "Partner Biologics A — fictional",
  expires_at: "2030-01-01T00:00:00Z",
  idempotency_key: "k-1",
};
const row = (status: string, value: unknown) => ({
  path: "s.f",
  section: "s",
  label: "F",
  status,
  value,
  withheld_reason: null,
  synthetic: true,
});

describe("W8 exports BFF", () => {
  afterEach(disarmBff);

  it("creates an export with the validated body and forwards 201", async () => {
    const fetchMock = armBff([
      Response.json(
        { id: EXPORT, status: "active", disclosed: [row("disclosed", "ok")], withheld: [] },
        { status: 201 },
      ),
    ]);
    const response = await CREATE(
      bffRequest("/api/demo/exports", { method: "POST", json: { ...body, evil: 1 } }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/exports");
    expect(sentBody(fetchMock)).toEqual(body);
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("keeps Idempotent-Replayed on a replay", async () => {
    armBff([
      new Response(JSON.stringify({ id: EXPORT, status: "active", disclosed: [], withheld: [] }), {
        status: 200,
        headers: { "content-type": "application/json", "Idempotent-Replayed": "true" },
      }),
    ]);
    const response = await CREATE(bffRequest("/x", { method: "POST", json: body }));
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
  });

  it("nulls hostile withheld values in the issued export", async () => {
    armBff([
      Response.json(
        {
          id: EXPORT,
          status: "active",
          disclosed: [row("disclosed", "ok")],
          withheld: [row("withheld", "LEAK")],
        },
        { status: 201 },
      ),
    ]);
    const out = (await (await CREATE(bffRequest("/x", { method: "POST", json: body }))).json()) as {
      withheld: { value: unknown }[];
    };
    expect(out.withheld[0].value).toBeNull();
  });

  it.each([
    ["a recipient without fictional", { recipient: "Partner Biologics A" }],
    ["an unknown purpose", { purpose: "model_training" }],
    ["a non-UTC expiry", { expires_at: "2030-01-01T00:00:00+02:00" }],
  ])("rejects %s with 422 before the backend", async (_name, override) => {
    const fetchMock = armBff([]);
    const response = await CREATE(
      bffRequest("/x", { method: "POST", json: { ...body, ...override } }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("validation_error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a cross-site POST", async () => {
    armBff([]);
    const response = await CREATE(
      bffRequest("/x", { method: "POST", json: body, fetchSite: "cross-site" }),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("cross_site_request");
  });

  it.each(["export_denied", "export_held"])(
    "%s keeps {policy_decision_id, decision, reasons} and drops anything else",
    async (code) => {
      armBff([
        Response.json(
          {
            code,
            message: "refused",
            details: {
              policy_decision_id: "d-1",
              decision: "deny",
              reasons: [{ code: "consent_withdrawn", message: "m", remediation: "r", extra: 1 }],
              internal: "SECRET",
            },
          },
          { status: 409 },
        ),
      ]);
      const response = await CREATE(bffRequest("/x", { method: "POST", json: body }));
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        code,
        message: "refused",
        details: {
          policy_decision_id: "d-1",
          decision: "deny",
          reasons: [{ code: "consent_withdrawn", message: "m", remediation: "r" }],
        },
      });
    },
  );

  it("passes 403 persona_forbidden details and 422 export_expiry_invalid max_days", async () => {
    armBff([
      Response.json(
        {
          code: "persona_forbidden",
          message: "no",
          details: { persona: "scientist", allowed: ["partner"] },
        },
        { status: 403 },
      ),
      Response.json(
        { code: "export_expiry_invalid", message: "too long", details: { max_days: 90, x: 1 } },
        { status: 422 },
      ),
    ]);
    const forbidden = await CREATE(bffRequest("/x", { method: "POST", json: body }));
    expect((await forbidden.json()).details).toEqual({
      persona: "scientist",
      allowed: ["partner"],
    });
    const expiry = await CREATE(bffRequest("/x", { method: "POST", json: body }));
    expect((await expiry.json()).details).toEqual({ max_days: 90 });
  });

  it("lists exports with a validated limit", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    expect((await LIST(bffRequest("/api/demo/exports?limit=10"))).status).toBe(200);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/exports?limit=10");
    armBff([]);
    expect((await LIST(bffRequest("/api/demo/exports?limit=500"))).status).toBe(422);
  });

  it("reads one export, no-store, and rejects an unsafe id", async () => {
    const fetchMock = armBff([
      Response.json({ id: EXPORT, status: "active", disclosed: [], withheld: [] }),
    ]);
    const response = await ONE(bffRequest("/x"), ctx(EXPORT));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/exports/${EXPORT}`);
    expect((await ONE(bffRequest("/x"), ctx("../x"))).status).toBe(400);
  });

  it.each(["suspended", "expired"])("never forwards the body of a %s export", async (status) => {
    armBff([
      Response.json({
        id: EXPORT,
        status,
        disclosed: [row("disclosed", "BODY")],
        withheld: [],
        suspended_reasons: [],
      }),
    ]);
    const out = (await (await ONE(bffRequest("/x"), ctx(EXPORT))).json()) as {
      disclosed: unknown[];
    };
    expect(out.disclosed).toEqual([]);
  });

  it("maps 404 not_found and a 5xx to 502 without leaking", async () => {
    armBff([envelope("not_found", 404), envelope("boom", 500)]);
    expect((await ONE(bffRequest("/x"), ctx(EXPORT))).status).toBe(404);
    const failed = await ONE(bffRequest("/x"), ctx(EXPORT));
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({
      code: "upstream_error",
      message: "The demo backend is unavailable",
    });
  });
});
