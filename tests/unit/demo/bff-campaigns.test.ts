import { afterEach, describe, expect, it } from "vitest";
import { GET as CAMPAIGNS } from "@/app/api/demo/campaigns/route";
import {
  GET as CHARTER,
  PUT as EDIT_CHARTER,
} from "@/app/api/demo/campaigns/[campaignId]/charter/route";
import { PUT as EDIT_QUOTA } from "@/app/api/demo/campaigns/[campaignId]/quota/route";
import { GET as USAGE } from "@/app/api/demo/campaigns/[campaignId]/credit-usage/route";
import { POST as CREATE_JOB } from "@/app/api/demo/jobs/route";
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

const CAMPAIGN = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (campaignId: string) => ({ params: Promise.resolve({ campaignId }) });
const thresholds = { potency_um_max: 10, replicates_min: 3, controls_required: true };
const edit = {
  thresholds,
  change_reason: "tighten the replicate count",
  expected_version: 1,
  idempotency_key: "k-1",
};

describe("W9 campaigns BFF reads", () => {
  afterEach(disarmBff);

  it("lists campaigns, no-store, with the session header", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    const response = await CAMPAIGNS(bffRequest("/api/demo/campaigns"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/campaigns");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it.each([
    ["charter", CHARTER, "charter"],
    ["credit usage", USAGE, "credit-usage"],
  ] as const)("reads the %s and rejects an unsafe id", async (_name, handler, tail) => {
    const fetchMock = armBff([Response.json({ id: CAMPAIGN })]);
    const response = await handler(bffRequest("/x"), ctx(CAMPAIGN));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/campaigns/${CAMPAIGN}/${tail}`);
    expect((await handler(bffRequest("/x"), ctx("../x"))).status).toBe(400);
  });

  it("maps 404 not_found without details", async () => {
    armBff([
      Response.json({ code: "not_found", message: "none", details: { x: 1 } }, { status: 404 }),
    ]);
    const response = await CHARTER(bffRequest("/x"), ctx(CAMPAIGN));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "not_found", message: "none" });
  });
});

describe("W9 charter edit BFF", () => {
  afterEach(disarmBff);

  it("forwards a validated edit; 201 for a new protocol version", async () => {
    const fetchMock = armBff([Response.json({ outcome: "new_protocol_version" }, { status: 201 })]);
    const response = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: { ...edit, extra: 1 } }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(201);
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/campaigns/${CAMPAIGN}/charter`);
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(sentBody(fetchMock)).toEqual(edit);
  });

  it("keeps 200 and Idempotent-Replayed on a replay", async () => {
    armBff([
      new Response(JSON.stringify({ outcome: "updated_open_version" }), {
        status: 200,
        headers: { "content-type": "application/json", "Idempotent-Replayed": "true" },
      }),
    ]);
    const response = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: edit }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
  });

  it.each([
    ["potency above 1000", { thresholds: { ...thresholds, potency_um_max: 1001 } }],
    ["replicates 0", { thresholds: { ...thresholds, replicates_min: 0 } }],
    ["a short reason", { change_reason: "no" }],
    ["no expected version", { expected_version: undefined }],
  ])("rejects %s with 422 before the backend", async (_name, override) => {
    const fetchMock = armBff([]);
    const response = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: { ...edit, ...override } }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a cross-site PUT and a non-JSON body", async () => {
    armBff([]);
    const cross = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: edit, fetchSite: "cross-site" }),
      ctx(CAMPAIGN),
    );
    expect(cross.status).toBe(403);
    const form = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", form: { a: "b" } }),
      ctx(CAMPAIGN),
    );
    expect(form.status).toBe(415);
  });

  it("passes charter_version_conflict with only current_version", async () => {
    armBff([
      Response.json(
        {
          code: "charter_version_conflict",
          message: "stale",
          details: { current_version: 3, x: 1 },
        },
        { status: 409 },
      ),
    ]);
    const response = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: edit }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).details).toEqual({ current_version: 3 });
  });

  it("drops details of other codes and passes persona_forbidden details", async () => {
    armBff([
      Response.json(
        { code: "idempotency_conflict", message: "m", details: { secret: 1 } },
        { status: 409 },
      ),
      Response.json(
        {
          code: "persona_forbidden",
          message: "no",
          details: { persona: "scientist", allowed: ["tenant_admin"] },
        },
        { status: 403 },
      ),
    ]);
    const conflict = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: edit }),
      ctx(CAMPAIGN),
    );
    expect(await conflict.json()).toEqual({ code: "idempotency_conflict", message: "m" });
    const forbidden = await EDIT_CHARTER(
      bffRequest("/x", { method: "PUT", json: edit }),
      ctx(CAMPAIGN),
    );
    expect((await forbidden.json()).details).toEqual({
      persona: "scientist",
      allowed: ["tenant_admin"],
    });
  });
});

describe("W9 quota BFF", () => {
  afterEach(disarmBff);

  it("forwards a validated quota change", async () => {
    const fetchMock = armBff([Response.json({ id: CAMPAIGN, credit_quota: 200 })]);
    const response = await EDIT_QUOTA(
      bffRequest("/x", {
        method: "PUT",
        json: { credit_quota: 200, reason: "raise it", extra: 1 },
      }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/campaigns/${CAMPAIGN}/quota`);
    expect(sentBody(fetchMock)).toEqual({ credit_quota: 200, reason: "raise it" });
  });

  it.each([
    ["a negative quota", { credit_quota: -1, reason: "valid" }],
    ["a quota above 1,000,000", { credit_quota: 1_000_001, reason: "valid" }],
    ["a missing reason", { credit_quota: 5 }],
  ])("rejects %s with 422", async (_name, json) => {
    const fetchMock = armBff([]);
    const response = await EDIT_QUOTA(bffRequest("/x", { method: "PUT", json }), ctx(CAMPAIGN));
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a cross-site PUT", async () => {
    armBff([]);
    const response = await EDIT_QUOTA(
      bffRequest("/x", {
        method: "PUT",
        json: { credit_quota: 5, reason: "valid" },
        fetchSite: "cross-site",
      }),
      ctx(CAMPAIGN),
    );
    expect(response.status).toBe(403);
  });
});

describe("job probe: quota_exhausted through the existing jobs route", () => {
  afterEach(disarmBff);

  it("passes the four numbers and nothing else", async () => {
    armBff([
      Response.json(
        {
          code: "quota_exhausted",
          message: "Quota exhausted.",
          details: { credit_quota: 100, committed: 100, requested: 10, remaining: 0, secret: 1 },
        },
        { status: 409 },
      ),
    ]);
    const response = await CREATE_JOB(
      bffRequest("/api/demo/jobs", {
        method: "POST",
        json: { kind: "screening", payload: { estimated_credits: 10 }, idempotency_key: "k" },
      }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "quota_exhausted",
      message: "Quota exhausted.",
      details: { credit_quota: 100, committed: 100, requested: 10, remaining: 0 },
    });
  });

  it("maps a backend 5xx to 502", async () => {
    armBff([envelope("boom", 500)]);
    const response = await CREATE_JOB(
      bffRequest("/api/demo/jobs", {
        method: "POST",
        json: { kind: "screening", payload: {}, idempotency_key: "k" },
      }),
    );
    expect(response.status).toBe(502);
  });
});
