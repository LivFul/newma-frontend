import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as BATCHES } from "@/app/api/demo/material-batches/route";
import { POST as CREATE_WP } from "@/app/api/demo/work-packages/route";
import { GET as READ_WP } from "@/app/api/demo/work-packages/[id]/route";
import { POST as IMPORT } from "@/app/api/demo/assay-imports/route";
import { POST as ACCEPT } from "@/app/api/demo/assay-imports/[id]/acceptance/route";
import { GET as RECON } from "@/app/api/demo/reconciliation/route";
import { POST as DISPOSITION } from "@/app/api/demo/reconciliation/items/[id]/disposition/route";
import { POST as ELN_EDIT } from "@/app/api/demo/eln/records/[recordId]/edit/route";
import { GET as PROPOSALS } from "@/app/api/demo/retraining-proposals/route";
import { POST as EXECUTE } from "@/app/api/demo/retraining-proposals/[id]/execute/route";
import { armBff, bffRequest, disarmBff, sentBody, sentUrl } from "./bff-helpers";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (json?: unknown) => bffRequest("/x", { method: "POST", json });
const wp = {
  candidate_id: ID,
  material_batch_id: ID,
  hypothesis: "DEMO-C-003 inhibits Target-α",
  assay_endpoint: "IC50",
  protocol_version: "v1-synthetic",
  controls: ["vehicle", "reference"],
  concentrations_um: [0.1, 1, 10],
  replicates: 3,
  deliverables: ["dose-response"],
  scenario: "standard",
  idempotency_key: "k-1",
};

describe("W5 lab BFF", () => {
  afterEach(disarmBff);

  it("lists batches for a UUID candidate", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    await BATCHES(bffRequest(`/api/demo/material-batches?candidate_id=${ID}`));
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/material-batches?candidate_id=${ID}`);
    expect((await BATCHES(bffRequest("/api/demo/material-batches?candidate_id=x"))).status).toBe(
      422,
    );
  });

  it("creates a work package with a validated body", async () => {
    const fetchMock = armBff([Response.json({ id: "wp", status: "held" }, { status: 201 })]);
    const response = await CREATE_WP(post({ ...wp, priority: "high" }));
    expect(response.status).toBe(201);
    expect(sentBody(fetchMock)).toEqual(wp);
  });

  it.each([
    { ...wp, controls: [] },
    { ...wp, concentrations_um: [] },
    { ...wp, concentrations_um: ["1"] },
    { ...wp, replicates: 0 },
    { ...wp, scenario: "chaos" },
    { ...wp, candidate_id: "DEMO" },
    { ...wp, hypothesis: "" },
  ])("rejects work package %j", async (body) => {
    const fetchMock = armBff([]);
    expect((await CREATE_WP(post(body))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("polls a work package with no-store", async () => {
    const fetchMock = armBff([Response.json({ id: ID })]);
    const response = await READ_WP(bffRequest("/x"), ctx(ID));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/work-packages/${ID}`);
  });

  it("forwards a duplicate import's 200 body unchanged (Review Focus 3)", async () => {
    const original = { id: "imp", duplicate: true, observation_ids: ["o1"], checksum_sha256: "c" };
    const fetchMock = armBff([Response.json(original, { status: 200 })]);
    const response = await IMPORT(post({ work_package_id: ID, eln_record_id: "ELN-1" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(original);
    expect(sentBody(fetchMock)).toEqual({ work_package_id: ID, eln_record_id: "ELN-1" });
    expect((await IMPORT(post({ work_package_id: ID, eln_record_id: "../x" }))).status).toBe(422);
  });

  it("accepts with a rationale and passes reconciliation_hold details", async () => {
    armBff([
      Response.json(
        { code: "reconciliation_hold", message: "Open items.", details: { open_items: ["S-03"] } },
        { status: 409 },
      ),
    ]);
    const response = await ACCEPT(
      post({ rationale: "Replicates consistent", idempotency_key: "k" }),
      ctx(ID),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).details).toEqual({ open_items: ["S-03"] });
    expect((await ACCEPT(post({ rationale: "" }), ctx(ID))).status).toBe(422);
  });

  it("reads reconciliation for a required UUID work package", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    await RECON(bffRequest(`/api/demo/reconciliation?work_package_id=${ID}`));
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/reconciliation?work_package_id=${ID}`);
    expect((await RECON(bffRequest("/api/demo/reconciliation"))).status).toBe(422);
  });

  it("records a disposition from the enum only", async () => {
    const fetchMock = armBff([Response.json({ id: ID })]);
    await DISPOSITION(
      post({ disposition: "exclude_sample", rationale: "Sample missing" }),
      ctx(ID),
    );
    expect(sentUrl(fetchMock)).toBe(
      `https://api.example/v1/reconciliation/items/${ID}/disposition`,
    );
    expect(
      (await DISPOSITION(post({ disposition: "ignore", rationale: "x" }), ctx(ID))).status,
    ).toBe(422);
  });

  it("edits a mock ELN record through the demo route", async () => {
    const fetchMock = armBff([
      Response.json({ record_id: "ELN-1", revision: 2, adapter_label: "Mock ELN" }),
    ]);
    await ELN_EDIT(post({ change: "correct_value" }), {
      params: Promise.resolve({ recordId: "ELN-1" }),
    });
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/eln/records/ELN-1/edit");
    expect(sentBody(fetchMock)).toEqual({ change: "correct_value" });
    expect(
      (
        await ELN_EDIT(post({ change: "delete" }), {
          params: Promise.resolve({ recordId: "ELN-1" }),
        })
      ).status,
    ).toBe(422);
  });

  it("lists retraining proposals and forwards the always-refused execute (IP C-04)", async () => {
    const details = { reason: "separate authorization required" };
    const fetchMock = armBff([
      Response.json({ items: [] }),
      Response.json(
        { code: "retraining_not_authorized", message: "Not authorized.", details },
        { status: 409 },
      ),
    ]);
    await PROPOSALS(bffRequest("/x"));
    const response = await EXECUTE(post(), ctx(ID));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "retraining_not_authorized",
      message: "Not authorized.",
      details,
    });
    expect(sentUrl(fetchMock, 1)).toBe(`https://api.example/v1/retraining-proposals/${ID}/execute`);
    expect(fetchMock.mock.calls[1][1].body).toBeUndefined();
  });

  it("answers 409 locally even if the backend ever returns 2xx for execute (IP C-04 invariant)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    armBff([Response.json({ id: ID, status: "executed" }, { status: 200 })]);
    const response = await EXECUTE(post(), ctx(ID));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("retraining_not_authorized");
    expect(JSON.stringify(body)).not.toContain("executed");
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
