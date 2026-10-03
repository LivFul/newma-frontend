import { afterEach, describe, expect, it } from "vitest";
import { GET as SOURCES } from "@/app/api/demo/curation/source-records/route";
import { GET as QUEUE } from "@/app/api/demo/curation/queue/route";
import { POST as INGEST } from "@/app/api/demo/ingestion/runs/route";
import { POST as DECIDE } from "@/app/api/demo/curation/claims/[id]/decisions/route";
import { POST as RELEASE } from "@/app/api/demo/curation/releases/route";
import { armBff, bffRequest, disarmBff, sentBody, sentUrl } from "./bff-helpers";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (json: unknown) => bffRequest("/x", { method: "POST", json });

describe("W2 curation BFF", () => {
  afterEach(disarmBff);

  it("lists source records and the queue (status validated)", async () => {
    const fetchMock = armBff([Response.json({ items: [] }), Response.json({ items: [] })]);
    await SOURCES(bffRequest("/x"));
    await QUEUE(bffRequest("/api/demo/curation/queue?status=pending_review"));
    expect(sentUrl(fetchMock, 0)).toBe("https://api.example/v1/curation/source-records");
    expect(sentUrl(fetchMock, 1)).toBe(
      "https://api.example/v1/curation/queue?status=pending_review",
    );
    expect((await QUEUE(bffRequest("/api/demo/curation/queue?status=bogus"))).status).toBe(422);
  });

  it("ingests with the client key and forwards a replay header", async () => {
    const replay = new Response(JSON.stringify({ id: "run" }), {
      status: 200,
      headers: { "content-type": "application/json", "idempotent-replayed": "true" },
    });
    const fetchMock = armBff([replay]);
    const response = await INGEST(post({ source_record_id: ID, idempotency_key: "k-1" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
    expect(sentBody(fetchMock)).toEqual({ source_record_id: ID, idempotency_key: "k-1" });
  });

  it("mints a key when absent and rejects a bad source id", async () => {
    const fetchMock = armBff([Response.json({ id: "run" }, { status: 201 })]);
    await INGEST(post({ source_record_id: ID }));
    expect((sentBody(fetchMock) as { idempotency_key: string }).idempotency_key).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect((await INGEST(post({ source_record_id: "x/y" }))).status).toBe(422);
  });

  it("passes source_not_cleared with policy details", async () => {
    const details = { policy_decision_id: "d", reasons: [{ code: "no_rights_record" }] };
    armBff([
      Response.json({ code: "source_not_cleared", message: "Rejected.", details }, { status: 409 }),
    ]);
    const response = await INGEST(post({ source_record_id: ID }));
    expect(response.status).toBe(409);
    expect((await response.json()).details).toEqual(details);
  });

  it("decides a claim and validates the decision", async () => {
    const fetchMock = armBff([Response.json({ id: ID, status: "approved" })]);
    const response = await DECIDE(
      post({ decision: "approve", rationale: "Matches source" }),
      ctx(ID),
    );
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/curation/claims/${ID}/decisions`);
    expect((await DECIDE(post({ decision: "maybe", rationale: "x" }), ctx(ID))).status).toBe(422);
    expect((await DECIDE(post({ decision: "approve", rationale: "" }), ctx(ID))).status).toBe(422);
    expect((await DECIDE(post({ decision: "approve", rationale: "x" }), ctx("../x"))).status).toBe(
      400,
    );
  });

  it("passes claim_quarantined with details", async () => {
    armBff([
      Response.json(
        { code: "claim_quarantined", message: "Quarantined.", details: { reason: "ambiguous" } },
        { status: 409 },
      ),
    ]);
    const response = await DECIDE(post({ decision: "approve", rationale: "x" }), ctx(ID));
    expect(await response.json()).toMatchObject({
      code: "claim_quarantined",
      details: { reason: "ambiguous" },
    });
  });

  it("publishes a release for UUID claim ids only", async () => {
    const fetchMock = armBff([Response.json({ id: "rel", version: 1 }, { status: 201 })]);
    const response = await RELEASE(post({ claim_ids: [ID], idempotency_key: "k-2" }));
    expect(response.status).toBe(201);
    expect(sentBody(fetchMock)).toEqual({ claim_ids: [ID], idempotency_key: "k-2" });
    expect((await RELEASE(post({ claim_ids: [] }))).status).toBe(422);
    expect((await RELEASE(post({ claim_ids: ["nope"] }))).status).toBe(422);
    expect((await RELEASE(post({ claim_ids: Array.from({ length: 201 }, () => ID) }))).status).toBe(
      422,
    );
  });

  it("de-duplicates claim ids and caps the rationale", async () => {
    const fetchMock = armBff([Response.json({ id: "rel" }, { status: 201 })]);
    await RELEASE(post({ claim_ids: [ID, ID], idempotency_key: "k" }));
    expect(sentBody(fetchMock)).toEqual({ claim_ids: [ID], idempotency_key: "k" });
    const tooLong = await DECIDE(
      post({ decision: "approve", rationale: "x".repeat(2001) }),
      ctx(ID),
    );
    expect(tooLong.status).toBe(422);
  });
});
