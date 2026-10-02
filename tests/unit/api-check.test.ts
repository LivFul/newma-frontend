import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiCheckError, runApiCheck } from "../../scripts/api-check.mjs";

const repo = path.resolve(__dirname, "../..");
const script = path.join(repo, "scripts/api-check.mjs");
const SIBLING_SPEC = "../newma-backend/docs/openapi.yaml";

/**
 * Where the real pinned spec can be read without touching the network: the CI override, else the
 * sibling backend checkout. Undefined means the cases that need the real spec are skipped.
 */
function resolveSpecSource(): string | undefined {
  const override = process.env.API_CHECK_SPEC_SOURCE?.trim();
  if (override) return override;
  const sibling = path.resolve(repo, SIBLING_SPEC);
  return existsSync(sibling) ? sibling : undefined;
}
const specSource = resolveSpecSource();
const specIsLocal = specSource !== undefined && !/^https?:\/\//.test(specSource);
const NO_SPEC = "needs the pinned spec: set API_CHECK_SPEC_SOURCE or check out ../newma-backend";
const NO_LOCAL_SPEC = "needs a local copy of the pinned spec (API_CHECK_SPEC_SOURCE is a URL)";

function sandbox({ git = true }: { git?: boolean } = {}): string {
  const dir = mkdtempSync(path.join(tmpdir(), "apicheck-"));
  mkdirSync(path.join(dir, "api"), { recursive: true });
  mkdirSync(path.join(dir, "src/lib/api/generated"), { recursive: true });
  cpSync(path.join(repo, "api/openapi.lock"), path.join(dir, "api/openapi.lock"));
  cpSync(
    path.join(repo, "src/lib/api/generated/schema.d.ts"),
    path.join(dir, "src/lib/api/generated/schema.d.ts"),
  );
  if (!git) return dir;
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"], {
    cwd: dir,
  });
  return dir;
}

/** Turn a sandbox into a tiny TypeScript project (repo node_modules linked) with one type error. */
function withTypeError(dir: string): string {
  symlinkSync(path.join(repo, "node_modules"), path.join(dir, "node_modules"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "sandbox", private: true }));
  writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, skipLibCheck: true, types: [] },
      include: ["src/**/*.ts"],
    }),
  );
  writeFileSync(path.join(dir, "src/bad.ts"), "export const n: number = 'not a number';\n");
  return dir;
}

const run = (cwd: string) =>
  spawnSync("node", [script, "--no-typecheck"], {
    cwd,
    env: {
      ...process.env,
      API_CHECK_REPO_ROOT: repo,
      API_CHECK_SPEC_SOURCE: specSource,
      NODE_PATH: path.join(repo, "node_modules"),
    },
    encoding: "utf8",
  });

describe("api:check", () => {
  beforeEach((ctx) => {
    if (!specSource) ctx.skip(NO_SPEC);
  });
  it("passes on a pristine tree", () => {
    const r = run(sandbox());
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });
  it("fails when the pinned sha does not match the spec", () => {
    const dir = sandbox();
    const lock = JSON.parse(readFileSync(path.join(dir, "api/openapi.lock"), "utf8"));
    writeFileSync(
      path.join(dir, "api/openapi.lock"),
      JSON.stringify({ ...lock, sha256: "0".repeat(64) }),
    );
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/sha256 mismatch/);
  });
  it("fails when the generated client was hand-edited", () => {
    const dir = sandbox();
    const f = path.join(dir, "src/lib/api/generated/schema.d.ts");
    writeFileSync(f, readFileSync(f, "utf8") + "\n// hand edit\n");
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "edit"], {
      cwd: dir,
    });
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/generated client is stale/);
  });
});

describe("runApiCheck (in-process)", () => {
  const readLock = (dir: string) =>
    JSON.parse(readFileSync(path.join(dir, "api/openapi.lock"), "utf8"));
  const writeLock = (dir: string, patch: Record<string, string>) =>
    writeFileSync(
      path.join(dir, "api/openapi.lock"),
      JSON.stringify({ ...readLock(dir), ...patch }),
    );
  const args = new Set(["--no-typecheck"]);
  const asFetch = (impl: () => Promise<Response>) => vi.fn(impl) as unknown as typeof fetch;
  /** Options that read the real pinned spec from the resolved source (never the network). */
  const real = (cwd: string) => ({
    cwd,
    repoRoot: repo,
    args,
    env: { API_CHECK_SPEC_SOURCE: specSource },
  });
  /** Options that read whatever the sandbox lock says; `env` is empty so CI's override cannot leak in. */
  const sandboxed = (cwd: string, repoRoot = repo) => ({ cwd, repoRoot, args, env: {} });
  const specText = () => readFileSync(specSource!, "utf8");
  const needsSpec = (ctx: { skip: (reason: string) => void }) => {
    if (!specSource) ctx.skip(NO_SPEC);
  };

  it("returns a summary naming the source it used", async (ctx) => {
    needsSpec(ctx);
    await expect(runApiCheck(real(sandbox()))).resolves.toMatch(
      new RegExp(`api:check: ok \\(api-v0\\.1\\.0-demo, source ${specSource}`),
    );
  });
  it("rejects when the lock version differs from the spec", async (ctx) => {
    needsSpec(ctx);
    const dir = sandbox();
    writeLock(dir, { version: "9.9.9" });
    await expect(runApiCheck(real(dir))).rejects.toThrow(ApiCheckError);
    await expect(runApiCheck(real(dir))).rejects.toThrow(/spec version/);
  });
  it("rejects when the spec file is missing", async () => {
    const dir = sandbox();
    writeLock(dir, { source: "does-not-exist.yaml" });
    await expect(runApiCheck(sandboxed(dir))).rejects.toThrow(/spec not found/);
  });
  it("rejects a spec without info.version", async () => {
    const dir = sandbox();
    writeFileSync(path.join(dir, "bad.yaml"), "openapi: 3.1.0\ninfo:\n  title: no version\n");
    writeLock(dir, { source: "bad.yaml" });
    await expect(runApiCheck(sandboxed(dir, dir))).rejects.toThrow(/info\.version/);
  });
  it("--update rewrites both sha256 and version from the spec", async (ctx) => {
    needsSpec(ctx);
    const dir = sandbox();
    writeLock(dir, { version: "9.9.9", sha256: "" });
    await runApiCheck({ ...real(dir), args: new Set(["--update", "--no-typecheck"]) });
    const lock = readLock(dir);
    expect(lock.version).toBe("0.1.0-demo");
    expect(lock.sha256).toBe(readLock(repo).sha256);
  });
  it("fetches an http source with a timeout signal", async (ctx) => {
    if (!specIsLocal) ctx.skip(NO_LOCAL_SPEC);
    const dir = sandbox();
    writeLock(dir, { source: "https://contract.example/openapi.yaml", sha256: "" });
    const fetchImpl = asFetch(async () => new Response(specText(), { status: 200 }));
    await runApiCheck({
      ...sandboxed(dir),
      args: new Set(["--update", "--no-typecheck"]),
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://contract.example/openapi.yaml",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(readLock(dir).sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it("rejects when the http source is not ok", async () => {
    const dir = sandbox();
    writeLock(dir, { source: "https://contract.example/openapi.yaml" });
    const fetchImpl = asFetch(async () => new Response("nope", { status: 500 }));
    await expect(runApiCheck({ ...sandboxed(dir), fetchImpl })).rejects.toThrow(/-> 500/);
  });
  it("rejects a cwd that is not a git checkout", async (ctx) => {
    needsSpec(ctx);
    const dir = sandbox({ git: false });
    await expect(runApiCheck(real(dir))).rejects.toThrow(/not a git repository/);
  });
  it("reports a real type error as an api:check failure", async (ctx) => {
    needsSpec(ctx);
    const dir = withTypeError(sandbox());
    await expect(runApiCheck({ ...real(dir), args: new Set() })).rejects.toThrow(
      /typecheck failed/,
    );
  });
});

describe("API_CHECK_SPEC_SOURCE override", () => {
  const args = new Set(["--no-typecheck"]);
  const specText = () => readFileSync(specSource!, "utf8");
  const runWithSource = (dir: string, source: string) =>
    runApiCheck({ cwd: dir, repoRoot: repo, args, env: { API_CHECK_SPEC_SOURCE: source } });
  beforeEach((ctx) => {
    if (!specIsLocal) ctx.skip(NO_LOCAL_SPEC);
  });

  it("passes when the override points at a copy of the pinned spec", async () => {
    const dir = sandbox();
    writeFileSync(path.join(dir, "remote.yaml"), specText());
    await expect(runWithSource(dir, path.join(dir, "remote.yaml"))).resolves.toMatch(
      /api:check: ok/,
    );
  });
  it("still enforces the pinned sha against a tampered override", async () => {
    const dir = sandbox();
    writeFileSync(path.join(dir, "remote.yaml"), specText() + "\n# tampered\n");
    await expect(runWithSource(dir, path.join(dir, "remote.yaml"))).rejects.toThrow(
      /sha256 mismatch/,
    );
  });
  it("names the override source in the mismatch message", async () => {
    const dir = sandbox();
    writeFileSync(path.join(dir, "remote.yaml"), specText() + "\n# tampered\n");
    await expect(runWithSource(dir, path.join(dir, "remote.yaml"))).rejects.toThrow(/remote\.yaml/);
  });
  it("falls back to the lock source when the override is empty", async () => {
    const dir = sandbox();
    writeFileSync(path.join(dir, "local.yaml"), specText());
    writeFileSync(
      path.join(dir, "api/openapi.lock"),
      JSON.stringify({
        ...JSON.parse(readFileSync(path.join(dir, "api/openapi.lock"), "utf8")),
        source: "local.yaml",
      }),
    );
    // --update: the generated header names the lock source, so a changed source is never "pristine".
    await expect(
      runApiCheck({
        cwd: dir,
        repoRoot: dir,
        args: new Set(["--update", "--no-typecheck"]),
        env: { API_CHECK_SPEC_SOURCE: "" },
      }),
    ).resolves.toMatch(/source local\.yaml/);
  });
});
