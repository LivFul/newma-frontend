import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ApiCheckError, runApiCheck } from "../../scripts/api-check.mjs";

const repo = path.resolve(__dirname, "../..");
const script = path.join(repo, "scripts/api-check.mjs");

function sandbox(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "apicheck-"));
  mkdirSync(path.join(dir, "api"), { recursive: true });
  mkdirSync(path.join(dir, "src/lib/api/generated"), { recursive: true });
  cpSync(path.join(repo, "api/openapi.lock"), path.join(dir, "api/openapi.lock"));
  cpSync(
    path.join(repo, "src/lib/api/generated/schema.d.ts"),
    path.join(dir, "src/lib/api/generated/schema.d.ts"),
  );
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"], {
    cwd: dir,
  });
  return dir;
}

const run = (cwd: string) =>
  spawnSync("node", [script, "--no-typecheck"], {
    cwd,
    env: { ...process.env, API_CHECK_REPO_ROOT: repo, NODE_PATH: path.join(repo, "node_modules") },
    encoding: "utf8",
  });

describe("api:check", () => {
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
  const specText = () => {
    const lock = JSON.parse(readFileSync(path.join(repo, "api/openapi.lock"), "utf8"));
    return readFileSync(path.resolve(repo, lock.source), "utf8");
  };
  const writeLock = (dir: string, patch: Record<string, string>) => {
    const lockFile = path.join(dir, "api/openapi.lock");
    const lock = JSON.parse(readFileSync(lockFile, "utf8"));
    writeFileSync(lockFile, JSON.stringify({ ...lock, ...patch }));
  };
  const args = new Set(["--no-typecheck"]);

  it("returns a summary on a pristine sandbox", async () => {
    await expect(runApiCheck({ cwd: sandbox(), repoRoot: repo, args })).resolves.toMatch(
      /api:check: ok \(api-v0\.1\.0-demo/,
    );
  });
  it("rejects when the lock version differs from the spec", async () => {
    const dir = sandbox();
    writeLock(dir, { version: "9.9.9" });
    await expect(runApiCheck({ cwd: dir, repoRoot: repo, args })).rejects.toThrow(ApiCheckError);
    await expect(runApiCheck({ cwd: dir, repoRoot: repo, args })).rejects.toThrow(/spec version/);
  });
  it("rejects when the spec file is missing", async () => {
    const dir = sandbox();
    writeLock(dir, { source: "does-not-exist.yaml" });
    await expect(runApiCheck({ cwd: dir, repoRoot: repo, args })).rejects.toThrow(/spec not found/);
  });
  it("fetches an http source and refreshes the lock hash with --update", async () => {
    const dir = sandbox();
    writeLock(dir, { source: "https://contract.example/openapi.yaml", sha256: "" });
    const fetchImpl = vi.fn(async () => new Response(specText(), { status: 200 }));
    await runApiCheck({
      cwd: dir,
      repoRoot: repo,
      args: new Set(["--update", "--no-typecheck"]),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalledWith("https://contract.example/openapi.yaml");
    const lock = JSON.parse(readFileSync(path.join(dir, "api/openapi.lock"), "utf8"));
    expect(lock.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it("rejects when the http source is not ok", async () => {
    const dir = sandbox();
    writeLock(dir, { source: "https://contract.example/openapi.yaml" });
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(
      runApiCheck({
        cwd: dir,
        repoRoot: repo,
        args,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/-> 500/);
  });
  it("reports a type error as an api:check failure", async () => {
    const dir = sandbox();
    await expect(
      runApiCheck({ cwd: dir, repoRoot: repo, args: new Set(["--only-typecheck"]) }),
    ).rejects.toThrow(/typecheck failed/);
  });
});
