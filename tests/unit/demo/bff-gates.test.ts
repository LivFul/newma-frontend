import { afterEach, describe, expect, it } from "vitest";
import { GET as CANDIDATES } from "@/app/api/demo/candidates/route";
import { GET as GATES } from "@/app/api/demo/candidates/[id]/gates/route";
import { GET as PACKAGES } from "@/app/api/demo/candidates/[id]/evidence-packages/route";
import { GET as DIFF } from "@/app/api/demo/candidates/[id]/evidence-packages/diff/route";
import { POST as DECIDE } from "@/app/api/demo/gates/[id]/decisions/route";
import { armBff, bffRequest, disarmBff, sentBody, sentUrl } from "./bff-helpers";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const decision = {
  decision: "pass",
  rationale: "Batch resolved and identity accepted",
  evidence_package_version: 1,
  confirm_candidate_display_id: "DEMO-C-002",
  idempotency_key: "k-1",
};

describe("W4 gates BFF", () => {
  afterEach(disarmBff);

  it("reads candidates, gates and packages with no-store", async () => {
    const fetchMock = armBff([
      Response.json({ items: [] }),
      Response.json({ gates: [] }),
      Response.json({ items: [] }),
    ]);
    expect((await CANDIDATES(bffRequest("/x"))).headers.get("cache-control")).toBe("no-store");
    await GATES(bffRequest("/x"), ctx(ID));
    await PACKAGES(bffRequest("/x"), ctx(ID));
    expect(sentUrl(fetchMock, 0)).toBe("https://api.example/v1/candidates");
    expect(sentUrl(fetchMock, 1)).toBe(`https://api.example/v1/candidates/${ID}/gates`);
    expect(sentUrl(fetchMock, 2)).toBe(`https://api.example/v1/candidates/${ID}/evidence-packages`);
    expect((await GATES(bffRequest("/x"), ctx("../x"))).status).toBe(400);
  });

  it("diffs integer versions only", async () => {
    const fetchMock = armBff([Response.json({ added: [] })]);
    await DIFF(bffRequest("/api/demo/x?from=1&to=2"), ctx(ID));
    expect(sentUrl(fetchMock)).toBe(
      `https://api.example/v1/candidates/${ID}/evidence-packages/diff?from=1&to=2`,
    );
    expect((await DIFF(bffRequest("/api/demo/x?from=1.5&to=2"), ctx(ID))).status).toBe(422);
    expect((await DIFF(bffRequest("/api/demo/x?from=1"), ctx(ID))).status).toBe(422);
  });

  it("forwards a decision and the replay header", async () => {
    const replay = new Response(JSON.stringify({ id: "gd" }), {
      status: 200,
      headers: { "content-type": "application/json", "idempotent-replayed": "true" },
    });
    const fetchMock = armBff([replay]);
    const response = await DECIDE(bffRequest("/x", { method: "POST", json: decision }), ctx(ID));
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/gates/${ID}/decisions`);
    expect(sentBody(fetchMock)).toEqual(decision);
  });

  it.each([
    { ...decision, decision: "advance" },
    { ...decision, rationale: "" },
    { ...decision, evidence_package_version: 0 },
    { ...decision, evidence_package_version: "1" },
    { ...decision, confirm_candidate_display_id: "" },
  ])("rejects %j", async (body) => {
    const fetchMock = armBff([]);
    expect((await DECIDE(bffRequest("/x", { method: "POST", json: body }), ctx(ID))).status).toBe(
      422,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes gate_requirements_missing details and persona_forbidden", async () => {
    const details = { stage: "H2", missing_requirements: ["biological replicates identified"] };
    armBff([
      Response.json(
        { code: "gate_requirements_missing", message: "Missing.", details },
        { status: 409 },
      ),
      Response.json(
        {
          code: "persona_forbidden",
          message: "No.",
          details: { persona: "scientist", allowed: ["scientific_approver"] },
        },
        { status: 403 },
      ),
      Response.json(
        { code: "step_up_mismatch", message: "Mismatch.", details: { typed: "x" } },
        { status: 422 },
      ),
    ]);
    const missing = await DECIDE(bffRequest("/x", { method: "POST", json: decision }), ctx(ID));
    expect((await missing.json()).details).toEqual(details);
    const forbidden = await DECIDE(bffRequest("/x", { method: "POST", json: decision }), ctx(ID));
    expect(forbidden.status).toBe(403);
    const mismatch = await DECIDE(bffRequest("/x", { method: "POST", json: decision }), ctx(ID));
    expect(await mismatch.json()).toEqual({ code: "step_up_mismatch", message: "Mismatch." });
  });
});
