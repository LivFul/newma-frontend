import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const script = path.resolve(__dirname, "../../scripts/check-demo-isolation.sh");
const repo = path.resolve(__dirname, "../..");

type Extension = "tsx" | "jsx" | "mts" | "cts" | "mdx";
const EXTENSIONS: readonly Extension[] = ["tsx", "jsx", "mts", "cts"];

const SPECIFIERS = [
  "@/lib/demo/x",
  "@/app/api/demo/x",
  "@/app/(platform)/demo/x",
  "../demo/x",
  "./demo/x",
  "../../lib/demo/x",
] as const;

const FORMS = {
  static: (s: string) => `import { x } from "${s}";\n`,
  dynamic: (s: string) => `const m = await import("${s}");\n`,
  require: (s: string) => `const m = require("${s}");\n`,
  "side-effect": (s: string) => `import "${s}";\n`,
  "export-from": (s: string) => `export * from "${s}";\n`,
} as const;

type Form = keyof typeof FORMS;

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "iso-"));
  for (const [rel, body] of Object.entries(files)) {
    const file = path.join(root, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  return root;
}

const DEMO_MODE_FILE = {
  "src/lib/demo/mode.ts": 'export const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";\n',
};

const run = (root: string) => spawnSync("bash", [script, root], { encoding: "utf8" });

const offendingCases = SPECIFIERS.flatMap((specifier, i) =>
  (Object.keys(FORMS) as Form[]).map((form, j) => ({
    specifier,
    form,
    ext: EXTENSIONS[(i + j) % EXTENSIONS.length],
  })),
);

describe("check-demo-isolation.sh", () => {
  it("passes a clean tree", () => {
    const root = tree({
      ...DEMO_MODE_FILE,
      "src/app/(marketing)/page.tsx": "export default function Page() { return null }\n",
    });
    expect(run(root).status).toBe(0);
  });

  it("fails on the flag outside demo dirs", () => {
    const root = tree({
      ...DEMO_MODE_FILE,
      "src/app/(marketing)/page.tsx": "const x = process.env.NEXT_PUBLIC_DEMO_MODE;\n",
    });
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/NEXT_PUBLIC_DEMO_MODE/);
  });

  it.each(offendingCases)(
    "fails on a $form import of $specifier from a .$ext file",
    ({ specifier, form, ext }) => {
      const root = tree({
        ...DEMO_MODE_FILE,
        [`src/app/(marketing)/page.${ext}`]: FORMS[form](specifier),
      });
      const r = run(root);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stdout + r.stderr).toMatch(/demo import outside demo subtree/);
    },
  );

  it("fails on a demo import from an .mdx file", () => {
    const root = tree({ "src/content/intro.mdx": 'import { Banner } from "@/lib/demo/banner";\n' });
    expect(run(root).status).toBe(1);
  });

  it("allows demo imports and the flag inside the demo subtrees", () => {
    const root = tree({
      ...DEMO_MODE_FILE,
      "src/lib/demo/other.ts": 'import { demo } from "@/lib/demo/mode";\n',
      "src/app/(platform)/demo/page.tsx": 'import { demo } from "@/lib/demo/mode";\n',
      "src/app/api/demo/route.ts": 'const m = await import("@/lib/demo/mode");\n',
    });
    expect(run(root).status).toBe(0);
  });

  it("allows modules whose name merely contains demo", () => {
    const root = tree({
      "src/app/(marketing)/page.tsx":
        'import { DemoBanner } from "@/components/demo-banner";\nimport x from "./components/demo-banner";\n',
    });
    expect(run(root).status).toBe(0);
  });

  it("passes the real repo", () => expect(run(repo).status).toBe(0));
});
