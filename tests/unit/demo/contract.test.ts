import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JOB_KINDS, JOB_STATES } from "@/lib/demo/jobs";
import { PERSONAS } from "@/lib/personas";

// Task 7: the demo modules build on the generated contract, not on hand-written shapes.
const root = path.resolve(__dirname, "../../..");
const schema = readFileSync(path.join(root, "src/lib/api/generated/schema.d.ts"), "utf8");
const demoApi = readFileSync(path.join(root, "src/lib/demo/api.ts"), "utf8");
const jobs = readFileSync(path.join(root, "src/lib/demo/jobs.ts"), "utf8");

const enumOf = (schemaName: string, field: string): string[] => {
  const block = schema.slice(schema.indexOf(`        ${schemaName}: {`));
  const line = block.split("\n").find((l) => l.trim().startsWith(`${field}:`)) ?? "";
  return [...line.matchAll(/"([a-z_A-Z]+)"/g)].map((m) => m[1]);
};

describe("P2 contract", () => {
  it("pins every demo-spine path", () => {
    for (const p of [
      "/v1/demo/sessions",
      "/v1/demo/sessions/current",
      "/v1/demo/sessions/current/persona",
      "/v1/demo/reset",
      "/v1/demo/keys",
      "/v1/jobs",
      "/v1/jobs/{job_id}",
      "/v1/jobs/{job_id}/cancel",
    ]) {
      expect(schema).toContain(`"${p}": {`);
    }
  });
  it("derives demo types from the generated schema", () => {
    expect(demoApi).toMatch(/from "@\/lib\/api\/generated\/schema"/);
    expect(jobs).toMatch(/components\["schemas"\]\["JobRead"\]/);
  });
  it("keeps the runtime vocabularies equal to the schema enums", () => {
    expect([...JOB_STATES]).toEqual(enumOf("JobRead", "state"));
    expect([...JOB_KINDS]).toEqual(enumOf("JobRead", "kind"));
    expect(PERSONAS.map((p) => p.id)).toEqual(enumOf("PersonaRequest", "persona"));
  });
});
