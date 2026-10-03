import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { POST as CREATE } from "@/app/api/demo/agent/queries/route";
import { GET as READ } from "@/app/api/demo/agent/queries/[id]/route";
import { armBff, bffRequest, disarmBff, sentBody, sentUrl } from "./bff-helpers";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const request = {
  objective: "Rank constituents",
  target_id: ID,
  budget_credits: 60,
  idempotency_key: "k-1",
};

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? routeFiles(full) : [full];
  });
}

describe("W3 agent BFF", () => {
  afterEach(disarmBff);

  it("creates a query (202) with the validated body", async () => {
    const fetchMock = armBff([Response.json({ id: "q" }, { status: 202 })]);
    const response = await CREATE(
      bffRequest("/x", { method: "POST", json: { ...request, approve: true } }),
    );
    expect(response.status).toBe(202);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/agent/queries");
    expect(sentBody(fetchMock)).toEqual(request);
  });

  it.each([
    { ...request, objective: "" },
    { ...request, target_id: "../x" },
    { ...request, budget_credits: -1 },
    { ...request, budget_credits: "60" },
    { ...request, idempotency_key: "bad key" },
  ])("rejects %j", async (body) => {
    const fetchMock = armBff([]);
    expect((await CREATE(bffRequest("/x", { method: "POST", json: body }))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads a query with no-store", async () => {
    const fetchMock = armBff([Response.json({ id: ID, status: "running" })]);
    const response = await READ(bffRequest("/x"), ctx(ID));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/agent/queries/${ID}`);
    expect((await READ(bffRequest("/x"), ctx("a/b"))).status).toBe(400);
  });

  it("exposes no approve/accept/advance handler under /api/demo/agent (ENT-05)", () => {
    const root = path.resolve(__dirname, "../../../src/app/api/demo/agent");
    const files = routeFiles(root).map((file) => path.relative(root, file));
    expect(files.sort()).toEqual(["queries/[id]/route.ts", "queries/route.ts"]);
  });
});
