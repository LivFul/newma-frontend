import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runClaimsCheck, hashNgram } from "../../../scripts/check-claims.mjs";
import {
  extractUiStrings,
  extractContentStrings,
  extractMdxProse,
  isProse,
} from "../../../scripts/claims/extract.mjs";
import {
  parseRegister,
  claimRefs,
  mdxClaimDeclaration,
} from "../../../scripts/claims/register.mjs";

const FIXTURE = path.resolve(__dirname, "../../fixtures/claims/clean");
const REPO_ROOT = path.resolve(__dirname, "../../..");
const dirs: string[] = [];

type Finding = { file: string; line: number; rule: string; message: string };

function repo(
  mutate: (
    write: (rel: string, text: string) => void,
    read: (rel: string) => string,
  ) => void = () => {},
) {
  const root = mkdtempSync(path.join(os.tmpdir(), "claims-"));
  dirs.push(root);
  cpSync(FIXTURE, root, { recursive: true });
  mutate(
    (rel, text) => {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text);
    },
    (rel) => readFileSync(path.join(root, rel), "utf8"),
  );
  return root;
}
const run = (root: string, extra: object = {}) =>
  runClaimsCheck({ root, denylist: [], ...extra }) as { ok: boolean; findings: Finding[] };
const rules = (root: string, extra: object = {}) => run(root, extra).findings.map((f) => f.rule);
const withCopy = (text: string, claims = "C-20") =>
  repo((write) =>
    write(
      "src/content/extra.ts",
      `export const X = { id: "x", text: ${JSON.stringify(text)}, claims: ["${claims}"] };\n`,
    ),
  );

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("runClaimsCheck on fixtures", () => {
  it("passes the clean fixture, including the allowed proper nouns", () => {
    const result = run(repo());
    expect(result.findings).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.each([
    ["a percentage sign", "Results improved by 50% in tests."],
    ["a spelled percentage", "Results improved by 50 percent."],
    ["a dollar sign", "The service costs $5 per run."],
    ["a euro sign", "The service costs €5 per run."],
    ["an LV-series id", "The program covers LV-123 only."],
    ["an LV code", "The program covers LV101R only."],
    ["a stray digit", "The platform has 3 components."],
    ["a quantified AI claim", "The agent is faster by 10 times."],
    ["a partner logo", "A partner logo appears here."],
    ["a superlative", "This is a proven method."],
  ])("fails on %s", (_label, text) => {
    expect(rules(withCopy(text))).toContain("forbidden-pattern");
  });

  it("fails on an unknown capitalised proper noun mid-sentence", () => {
    expect(rules(withCopy("The platform works with Zorblax for storage."))).toContain(
      "proper-noun",
    );
  });

  it("allows a capitalised word at the start of a sentence", () => {
    expect(rules(withCopy("Scientists approve work. Agents recommend only."))).toEqual([]);
  });

  it("fails on a name present in the hash deny-list, without printing it", () => {
    const hash = createHash("sha256").update("zorblax biotech").digest("hex");
    const root = withCopy("The platform works with zorblax biotech for storage.");
    const { findings, ok } = run(root, { denylist: [hash] });
    expect(ok).toBe(false);
    const hit = findings.find((f) => f.rule === "denylist");
    expect(hit).toBeDefined();
    expect(JSON.stringify(findings).toLowerCase()).not.toContain("zorblax");
    expect(hit!.message).not.toContain(hash);
  });

  it("finds a deny-listed single token and a four-token name", () => {
    expect(hashNgram(["Zorblax", "Biotech"])).toBe(
      createHash("sha256").update("zorblax biotech").digest("hex"),
    );
    const hash = createHash("sha256").update("a b c d").digest("hex");
    expect(rules(withCopy("It mentions a b c d plainly."), { denylist: [hash] })).toContain(
      "denylist",
    );
  });

  it("fails on JSX prose written inside a component", () => {
    const root = repo((write) =>
      write(
        "src/components/site/bad.tsx",
        "export const Bad = () => <p>Hand written marketing copy</p>;\n",
      ),
    );
    expect(rules(root)).toContain("no-inline-prose");
  });

  it("fails on a literal aria-label inside a component", () => {
    const root = repo((write) =>
      write(
        "src/components/site/bad.tsx",
        'export const Bad = () => <button aria-label="Open the thing">x</button>;\n',
      ),
    );
    expect(rules(root)).toContain("no-inline-prose");
  });

  it("fails on an MDX file with no claims comment", () => {
    const root = repo((write) =>
      write("src/content/other.mdx", "## Heading\n\nA proposed design.\n"),
    );
    expect(rules(root)).toContain("missing-claims-declaration");
  });

  it("fails on a content module with prose and no claim id", () => {
    const root = repo((write) =>
      write("src/content/nodeclare.ts", 'export const T = "A proposed sentence with no claim.";\n'),
    );
    expect(rules(root)).toContain("missing-claims-declaration");
  });

  it("fails on a claim id that is not in the register", () => {
    expect(rules(withCopy("A proposed sentence.", "C-55"))).toContain("unknown-claim");
  });

  it("fails on an unknown claim id in the content matrix", () => {
    const root = repo((write, read) =>
      write("docs/CONTENT_MATRIX.md", `${read("docs/CONTENT_MATRIX.md")}| Extra | x | C-58 |\n`),
    );
    expect(rules(root)).toContain("unknown-claim");
  });

  it("fails on a register row in the P4 range that nothing references", () => {
    const root = repo((write, read) =>
      write(
        "PROGRESS.md",
        read("PROGRESS.md").replace(
          /^\| C-21 .*$/m,
          (row) => `${row}\n| C-22 | home | orphan | TA | draft |`,
        ),
      ),
    );
    const findings = run(root).findings;
    expect(findings.filter((f) => f.rule === "orphan-register-row").map((f) => f.message)).toEqual([
      expect.stringContaining("C-22"),
    ]);
  });

  it("ignores register rows outside the P4 range and rows after the register section", () => {
    expect(rules(repo())).toEqual([]);
  });

  it("reports file, line and rule for every finding", () => {
    const { findings } = run(withCopy("Wrong 50% claim."));
    for (const f of findings) {
      expect(f.file).toMatch(/\.(ts|tsx|mdx|md)$/);
      expect(f.line).toBeGreaterThan(0);
      expect(f.rule).toMatch(/^[a-z-]+$/);
    }
  });
});

const DEMO_PAGE = "src/app/(platform)/demo/w9-campaign/page.tsx";
const withDemoPage = (body: string) => ({ root: repo((write) => write(DEMO_PAGE, body)) });
const demoRules = (body: string, extra: object = {}) => {
  const { root } = withDemoPage(body);
  return rules(root, extra);
};

describe("NUM figures (P6 extension)", () => {
  it.each([
    ["a percentage", "<p>Quota used: 40%</p>"],
    ["a spelled percentage", "<p>About 40 percent of the quota.</p>"],
    ["a currency amount", "<p>Cost: $5 per job</p>"],
    ["a currency code amount", "<p>Cost: 5 EUR per job</p>"],
    ["a scaled quantity", "<p>Market of 3 million compounds</p>"],
    ["a royalty split", "<p>A 5 royalty applies</p>"],
    ["basis points", "<p>Share of 250 basis points</p>"],
  ])("fails on %s in a demo page without a claim id", (_label, jsx) => {
    expect(demoRules(`export const P = () => ${jsx};\n`)).toContain("num-figure");
  });

  it("passes the same figure in a demo page that cites a registered claim id", () => {
    const body = `// claims: C-01\nexport const P = () => <p>Quota used: 40%</p>;\n`;
    expect(demoRules(body)).toEqual([]);
  });

  it("waives only the figure next to the marker, not every figure in the file", () => {
    const body = `// claims: C-01\nexport const A = () => <p>Quota used: 40%</p>;\n\nexport const B = () => <p>Cost: 5 EUR per job</p>;\n`;
    expect(demoRules(body)).toEqual(["num-figure"]);
  });

  it("fails when the cited claim id is not in the register", () => {
    const body = `// claims: C-77\nexport const P = () => <p>Quota used: 40%</p>;\n`;
    expect(demoRules(body)).toContain("unknown-claim");
  });

  it("allows demo credits and plain counts, which are not NUM figures", () => {
    const body = `export const P = () => <p>Quota set to 10 demo credits, step 3 of 16</p>;\n`;
    expect(demoRules(body)).toEqual([]);
  });

  it("allows capitalised labels and inline prose in a demo page (only figures and names are checked)", () => {
    const body = `export const P = () => <p>Mock ELN and Simulated agent run Here.</p>;\n`;
    expect(demoRules(body)).toEqual([]);
  });

  it("fails on a NUM figure in src/content even when the file has a claim id", () => {
    expect(rules(withCopy("Results improved by 40 percent in tests."))).toContain("num-figure");
  });

  it("scans string literals under src/lib/demo", () => {
    const root = repo((write) =>
      write("src/lib/demo/copy.ts", 'export const T = "Quota used 40% of the total";\n'),
    );
    expect(rules(root)).toContain("num-figure");
  });

  it("reports file, line and rule for a demo finding", () => {
    const { root } = withDemoPage("export const P = () => (\n  <p>Quota used: 40%</p>\n);\n");
    const hit = run(root).findings.find((f) => f.rule === "num-figure");
    expect(hit).toMatchObject({ file: DEMO_PAGE, line: 2 });
  });
});

describe("explicit deny-list (P6 extension)", () => {
  const terms = ["Zorblax Biotech"];

  it("fails on a listed organisation in a demo page, without printing it", () => {
    const { root } = withDemoPage("export const P = () => <p>Supplied by zorblax biotech.</p>;\n");
    const { findings, ok } = run(root, { denyTerms: terms });
    expect(ok).toBe(false);
    expect(findings.map((f) => f.rule)).toContain("denylist");
    expect(JSON.stringify(findings).toLowerCase()).not.toContain("zorblax");
  });

  it("fails on a listed organisation in src/content and in site UI", () => {
    expect(rules(withCopy("Built with Zorblax Biotech tools."), { denyTerms: terms })).toContain(
      "denylist",
    );
    const ui = repo((write) =>
      write("src/components/site/x.tsx", 'export const X = () => <b title="Zorblax Biotech" />;\n'),
    );
    expect(rules(ui, { denyTerms: terms })).toContain("denylist");
  });

  it("matches whole words only", () => {
    expect(rules(withCopy("A zorblaxed biotechnology result."), { denyTerms: terms })).toEqual([]);
  });

  it("ships a generic placeholder list that is valid and free of digits", () => {
    const file = path.join(REPO_ROOT, "scripts/claims-denylist.json");
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { terms: string[] };
    expect(parsed.terms.length).toBeGreaterThanOrEqual(3);
    for (const term of parsed.terms) expect(term).toMatch(/^[A-Za-z][A-Za-z ]+$/);
  });

  it("uses the shipped list by default", () => {
    const { terms: shipped } = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "scripts/claims-denylist.json"), "utf8"),
    ) as { terms: string[] };
    const body = `export const P = () => <p>Run with ${shipped[0]} here.</p>;\n`;
    expect(demoRules(body)).toContain("denylist");
  });
});

describe("extraction", () => {
  it("extractUiStrings finds JSX text, listed attributes, metadata properties and alt consts", () => {
    const source = `
      export const alt = "Alt text here";
      export const meta = { title: "Page title", description: \`Page \${x} description\`, other: "Ignored value" };
      export const A = () => (
        <div className="x" aria-label="Label text" title={"Title text"} data-x="Not copy">
          Hello world
          <span aria-hidden="true">/</span>
          {value}
        </div>
      );`;
    const found = extractUiStrings(source, "x.tsx").map((f: { text: string; kind: string }) => [
      f.kind,
      f.text,
    ]);
    expect(found).toEqual(
      expect.arrayContaining([
        ["property", "Alt text here"],
        ["property", "Page title"],
        ["property", "Page description"],
        ["attribute", "Label text"],
        ["attribute", "Title text"],
        ["jsx-text", "Hello world"],
        ["jsx-text", "/"],
      ]),
    );
    expect(
      found.some(([, text]: string[]) => text === "Not copy" || text === "Ignored value"),
    ).toBe(false);
  });

  it("extractUiStrings is not fooled by TypeScript generics", () => {
    const source =
      'type P = Omit<ComponentProps<typeof Link>, "href"> & Pick<Foo, "a">;\nexport const x = 1;';
    expect(extractUiStrings(source, "g.tsx")).toEqual([]);
  });

  it("extractContentStrings keeps prose and drops ids, slugs, paths, urls and claim ids", () => {
    const source = `export const a = ["home.hero.title", "agentic-compute", "/demo/w3-agent", "https://x.y", "C-20", "2A", "Plain prose here", "Interface", \`Opens the \${t} page.\`];`;
    expect(extractContentStrings(source, "c.ts").map((f: { text: string }) => f.text)).toEqual([
      "Plain prose here",
      "Interface",
      "Opens the  page.",
    ]);
  });

  it("isProse classifies a few boundary strings", () => {
    expect(isProse("home.hero.title")).toBe(false);
    expect(isProse("Optional, simulated")).toBe(true);
    expect(isProse("TA")).toBe(false);
    expect(isProse("123")).toBe(false);
    expect(isProse("#product")).toBe(false);
  });

  it("extractMdxProse strips markdown, comments, imports and code fences", () => {
    const source =
      "{/* claims: C-1 */}\nimport X from 'y'\n\n## A heading\n\n- Item with `code` and [a link](/x)\n\n```js\nconst nope = 1;\n```\n\nPlain **bold** text.\n";
    expect(extractMdxProse(source).map((f: { text: string; line: number }) => f.text)).toEqual([
      "A heading",
      "Item with code and a link",
      "Plain bold text.",
    ]);
  });
});

describe("register parsing", () => {
  it("reads the rows under the Claim register heading only", () => {
    const rows = parseRegister(readFileSync(path.join(FIXTURE, "PROGRESS.md"), "utf8")) as Map<
      string,
      unknown
    >;
    expect([...rows.keys()]).toEqual(["C-01", "C-20", "C-21"]);
  });
  it("collects claim references with lines and MDX declarations", () => {
    expect(claimRefs("a C-20 b\nC-21 and C-22")).toEqual([
      { id: "C-20", line: 1 },
      { id: "C-21", line: 2 },
      { id: "C-22", line: 2 },
    ]);
    expect(mdxClaimDeclaration("{/* claims: C-40, C-47 */}\ntext")).toEqual(["C-40", "C-47"]);
    expect(mdxClaimDeclaration("text only")).toBeNull();
  });
});

describe("the deny-list file", () => {
  it("holds only SHA-256 hex digests, never plaintext names", () => {
    const hashes = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "scripts/claims/denylist.hashes.json"), "utf8"),
    ) as unknown;
    expect(Array.isArray(hashes)).toBe(true);
    expect((hashes as string[]).length).toBeGreaterThan(20);
    for (const h of hashes as string[]) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(hashes as string[]).size).toBe((hashes as string[]).length);
  });
});

describe("the real repository", () => {
  it("passes the claims check", () => {
    const { findings, ok } = runClaimsCheck({ root: REPO_ROOT });
    expect(findings.map((f: Finding) => `${f.file}:${f.line} ${f.rule}`)).toEqual([]);
    expect(ok).toBe(true);
  });
});
