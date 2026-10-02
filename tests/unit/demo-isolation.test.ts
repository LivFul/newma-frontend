import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const script = path.resolve(__dirname, "../../scripts/check-demo-isolation.sh");

function tree(offender: "none" | "flag" | "import"): string {
  const root = mkdtempSync(path.join(tmpdir(), "iso-"));
  mkdirSync(path.join(root, "src/lib/demo"), { recursive: true });
  mkdirSync(path.join(root, "src/app/(marketing)"), { recursive: true });
  writeFileSync(
    path.join(root, "src/lib/demo/mode.ts"),
    'export const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";\n',
  );
  const page =
    offender === "flag"
      ? "const x = process.env.NEXT_PUBLIC_DEMO_MODE;\n"
      : offender === "import"
        ? 'import { demo } from "@/lib/demo/mode";\n'
        : "export default function Page() { return null }\n";
  writeFileSync(path.join(root, "src/app/(marketing)/page.tsx"), page);
  return root;
}

const run = (root: string) => spawnSync("bash", [script, root], { encoding: "utf8" });

describe("check-demo-isolation.sh", () => {
  it("passes a clean tree", () => expect(run(tree("none")).status).toBe(0));
  it("fails on the flag outside demo dirs", () => {
    const r = run(tree("flag"));
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/NEXT_PUBLIC_DEMO_MODE/);
  });
  it("fails on a demo import outside demo dirs", () => expect(run(tree("import")).status).toBe(1));
  it("passes the real repo", () => expect(run(path.resolve(__dirname, "../..")).status).toBe(0));
});
