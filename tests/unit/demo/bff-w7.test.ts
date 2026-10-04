import { readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  armBff,
  bffRequest,
  disarmBff,
  envelope,
  sentBody,
  sentHeaders,
  sentUrl,
  SID,
} from "./bff-helpers";
import {
  COLLECTION_POSTS,
  GET_CASES,
  ID,
  OUTAGE_PUT,
  POST_CASES,
  idHandlers,
} from "./w7-bff-cases";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (json?: unknown, extra: Record<string, unknown> = {}) =>
  bffRequest("/x", { method: "POST", json, ...extra });
const API = "https://api.example";

describe("W7 BFF: reads (A1, A3, A4, A7, A8, A10, A11, A21, A24, A25)", () => {
  afterEach(disarmBff);

  it.each(GET_CASES)(
    "$name forwards the session and answers no-store",
    async ({ call, path, upstream }) => {
      const fetchMock = armBff([Response.json({ items: [] })]);
      const response = await call(bffRequest(path));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(sentUrl(fetchMock)).toBe(`${API}${upstream}`);
      expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    },
  );

  it.each(idHandlers)(
    "%s rejects an unsafe id before any upstream call",
    async (_name, handler) => {
      const fetchMock = armBff([]);
      const response = await handler(bffRequest("/x"), ctx("../etc"));
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("invalid_id");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("filters benefits by a UUID license and rejects anything else", async () => {
    const { GET } = await import("@/app/api/demo/benefits/route");
    const fetchMock = armBff([Response.json({ items: [] })]);
    await GET(bffRequest(`/api/demo/benefits?license_id=${ID}`));
    expect(sentUrl(fetchMock)).toBe(`${API}/v1/benefits?license_id=${ID}`);
    expect((await GET(bffRequest("/api/demo/benefits?license_id=nope"))).status).toBe(422);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("W7 BFF: id-scoped writes", () => {
  afterEach(disarmBff);

  it.each(POST_CASES)(
    "$name forwards a validated body with the key",
    async ({ handler, upstream, body }) => {
      const fetchMock = armBff([Response.json({ id: ID }, { status: 200 })]);
      const response = await handler(post({ ...body, unexpected: "dropped" }), ctx(ID));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(sentUrl(fetchMock)).toBe(`${API}${upstream}`);
      expect(sentBody(fetchMock)).toEqual(body);
      expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    },
  );

  it.each(POST_CASES)(
    "$name mints an idempotency key server-side when absent",
    async ({ handler, body }) => {
      const fetchMock = armBff([Response.json({ id: ID })]);
      const rest = { ...body, idempotency_key: undefined };
      await handler(post(rest), ctx(ID));
      expect(String((sentBody(fetchMock) as Record<string, unknown>).idempotency_key)).toMatch(
        /^[0-9a-f-]{36}$/,
      );
    },
  );

  it.each(POST_CASES)(
    "$name rejects an invalid body with 422 before any upstream call",
    async ({ handler, invalid }) => {
      const fetchMock = armBff([]);
      const response = await handler(post(invalid), ctx(ID));
      expect(response.status).toBe(422);
      expect((await response.json()).code).toBe("validation_error");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(POST_CASES)("$name rejects an unsafe id with 400", async ({ handler, body }) => {
    const fetchMock = armBff([]);
    expect((await handler(post(body), ctx("a b"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(POST_CASES)("$name refuses a cross-site POST with 403", async ({ handler, body }) => {
    const fetchMock = armBff([]);
    const response = await handler(post(body, { fetchSite: "cross-site" }), ctx(ID));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(POST_CASES)(
    "$name forwards the 200 replay body and Idempotent-Replayed unchanged",
    async ({ handler, body }) => {
      const original = { id: ID, state: "reviewed" };
      armBff([
        Response.json(original, { status: 200, headers: { "Idempotent-Replayed": "true" } }),
      ]);
      const response = await handler(post(body), ctx(ID));
      expect(response.status).toBe(200);
      expect(response.headers.get("idempotent-replayed")).toBe("true");
      expect(await response.json()).toEqual(original);
    },
  );

  it.each(POST_CASES)(
    "$name passes persona_forbidden with persona and allowed only",
    async ({ handler, body }) => {
      armBff([
        Response.json(
          {
            code: "persona_forbidden",
            message: "no",
            details: { persona: "partner", allowed: ["finance"], secret: 1 },
          },
          { status: 403 },
        ),
      ]);
      const response = await handler(post(body), ctx(ID));
      expect(response.status).toBe(403);
      expect((await response.json()).details).toEqual({ persona: "partner", allowed: ["finance"] });
    },
  );
});

describe("W7 BFF: collection writes (A2, A9)", () => {
  afterEach(disarmBff);

  it.each(COLLECTION_POSTS)(
    "$name forwards 201 with the validated body",
    async ({ handler, upstream, body }) => {
      const fetchMock = armBff([Response.json({ id: ID }, { status: 201 })]);
      const response = await handler(post({ ...body, extra: 1 }));
      expect(response.status).toBe(201);
      expect(sentUrl(fetchMock)).toBe(`${API}${upstream}`);
      expect(sentBody(fetchMock)).toEqual(body);
    },
  );

  it.each(COLLECTION_POSTS)(
    "$name rejects an invalid body and a cross-site POST",
    async ({ handler, invalid, body }) => {
      const fetchMock = armBff([]);
      expect((await handler(post(invalid))).status).toBe(422);
      expect((await handler(post(body, { fetchSite: "cross-site" }))).status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("W7 BFF: committed refusals keep only their allow-listed details", () => {
  afterEach(disarmBff);

  it("receipt_duplicate forwards {duplicate_of, receipt_id} and nothing else", async () => {
    const { POST } = await import("@/app/api/demo/settlements/[id]/receipts/route");
    armBff([
      Response.json(
        {
          code: "receipt_duplicate",
          message: "dup",
          details: { duplicate_of: "r1", receipt_id: "r2", amount: 9 },
        },
        { status: 409 },
      ),
    ]);
    const response = await POST(post({ external_ref: "DEMO-1", amount_demo_credits: 5 }), ctx(ID));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "receipt_duplicate",
      message: "dup",
      details: { duplicate_of: "r1", receipt_id: "r2" },
    });
  });

  it("license_rights_not_allowed forwards the reasons list", async () => {
    const { POST } = await import("@/app/api/demo/licenses/[id]/decision/route");
    armBff([
      Response.json(
        {
          code: "license_rights_not_allowed",
          message: "no",
          details: {
            policy_decision_id: "d",
            reasons: [{ code: "purpose_not_permitted", message: "m", leak: 1 }],
          },
        },
        { status: 409 },
      ),
    ]);
    const response = await POST(post({ decision: "approve", rationale: "Scope fits" }), ctx(ID));
    expect((await response.json()).details).toEqual({
      policy_decision_id: "d",
      reasons: [{ code: "purpose_not_permitted", message: "m" }],
    });
  });

  it("agreement_not_found passes without details", async () => {
    const { POST } = await import("@/app/api/demo/licenses/route");
    armBff([
      Response.json(
        { code: "agreement_not_found", message: "x", details: { a: 1 } },
        { status: 404 },
      ),
    ]);
    const response = await POST(
      post({
        agreement_id: ID,
        licensee_organization_id: ID,
        purpose: "research",
        scope_summary: "abc",
        term_months: 1,
      }),
    );
    expect(await response.json()).toEqual({ code: "agreement_not_found", message: "x" });
  });

  it("an unknown 409 code carries no details", async () => {
    const { POST } = await import("@/app/api/demo/settlements/[id]/review/route");
    armBff([envelope("something_new", 409)]);
    expect((await (await POST(post({}), ctx(ID))).json()).details).toBeUndefined();
  });
});

describe("W7 BFF: anchoring outage (A25, A26)", () => {
  afterEach(disarmBff);

  it("PUT sets an absolute state with no idempotency key", async () => {
    const fetchMock = armBff([
      Response.json({ active: true, label: "Optional, simulated", updated_at: null }),
    ]);
    const response = await OUTAGE_PUT(
      bffRequest("/x", { method: "PUT", json: { active: true, extra: 1 } }),
    );
    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(sentUrl(fetchMock)).toBe(`${API}/v1/demo/anchoring/outage`);
    expect(sentBody(fetchMock)).toEqual({ active: true });
  });

  it("PUT rejects a non-boolean and a cross-site request", async () => {
    const fetchMock = armBff([]);
    expect(
      (await OUTAGE_PUT(bffRequest("/x", { method: "PUT", json: { active: "yes" } }))).status,
    ).toBe(422);
    expect(
      (
        await OUTAGE_PUT(
          bffRequest("/x", { method: "PUT", json: { active: true }, fetchSite: "cross-site" }),
        )
      ).status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("W7 BFF: surface", () => {
  it("has no route handler for settlement pause or resume (A-P5A-02)", () => {
    const dir = path.join(process.cwd(), "src/app/api/demo/settlements/[id]");
    const entries = readdirSync(dir);
    expect(entries).not.toContain("pause");
    expect(entries).not.toContain("resume");
    expect(entries.sort()).toEqual(
      [
        "approvals",
        "audit",
        "dispute",
        "distribution",
        "events",
        "evidence-approval",
        "receipts",
        "reconcile",
        "resolve",
        "review",
        "route.ts",
      ].sort(),
    );
  });
});
