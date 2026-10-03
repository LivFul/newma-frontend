// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkVectors,
  syncVectors,
  VectorsError,
} from "../../../scripts/sync-canonical-vectors.mjs";

const VECTORS = '[{"name":"a","input":{},"canonical":"{}","sha256":"x"}]\n';

function sandbox({ backend = true }: { backend?: boolean } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "vectors-"));
  const repo = path.join(root, "newma-frontend");
  mkdirSync(path.join(repo, "tests/fixtures/canonical"), { recursive: true });
  const backendFile = path.join(root, "newma-backend/fixtures/canonical/vectors.json");
  if (backend) {
    mkdirSync(path.dirname(backendFile), { recursive: true });
    writeFileSync(backendFile, VECTORS);
  }
  return { repo, backendFile };
}

describe("sync-canonical-vectors", () => {
  it("--write vendors the backend file and its lock; --check then passes", async () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    expect(readFileSync(path.join(repo, "tests/fixtures/canonical/vectors.json"), "utf8")).toBe(
      VECTORS,
    );
    const lock = JSON.parse(
      readFileSync(path.join(repo, "tests/fixtures/canonical/vectors.lock"), "utf8"),
    );
    expect(lock.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(await checkVectors({ repoRoot: repo, backendFile })).toMatch(/matches the backend/);
  });

  it("--check fails when the backend copy drifted", async () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    writeFileSync(backendFile, VECTORS.replace('"a"', '"b"'));
    await expect(checkVectors({ repoRoot: repo, backendFile })).rejects.toThrow(VectorsError);
  });

  it("--check without the sibling verifies the vendored file against the lock (local run)", async () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    const missing = path.join(repo, "no-such/vectors.json");
    expect(await checkVectors({ repoRoot: repo, backendFile: missing })).toMatch(
      /matches its lock/,
    );
    writeFileSync(path.join(repo, "tests/fixtures/canonical/vectors.json"), "[]\n");
    await expect(checkVectors({ repoRoot: repo, backendFile: missing })).rejects.toThrow(/lock/);
  });

  it("--write fails without the backend file", () => {
    const { repo, backendFile } = sandbox({ backend: false });
    expect(() => syncVectors({ repoRoot: repo, backendFile })).toThrow(VectorsError);
  });
});

describe("sync-canonical-vectors in CI", () => {
  const setup = () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    return { repo, missing: path.join(repo, "no-such/vectors.json") };
  };
  const serving =
    (body: string, status = 200) =>
    async () =>
      new Response(body, { status });

  it("compares with the deployed vectors when NEWMA_VECTORS_URL is set", async () => {
    const { repo, missing } = setup();
    const ok = await checkVectors({
      repoRoot: repo,
      backendFile: missing,
      ci: true,
      vectorsUrl: "https://api.example/canonical-vectors.json",
      fetchImpl: serving(VECTORS),
    });
    expect(ok).toMatch(/matches the deployed API/);
    await expect(
      checkVectors({
        repoRoot: repo,
        backendFile: missing,
        ci: true,
        vectorsUrl: "https://api.example/v.json",
        fetchImpl: serving(VECTORS.replace('"a"', '"b"')),
      }),
    ).rejects.toThrow(/drifted from the deployed API/);
  });

  it("fails when the deployed vectors cannot be fetched", async () => {
    const { repo, missing } = setup();
    await expect(
      checkVectors({
        repoRoot: repo,
        backendFile: missing,
        ci: true,
        vectorsUrl: "https://api.example/v.json",
        fetchImpl: serving("nope", 404),
      }),
    ).rejects.toThrow(/could not fetch/);
    await expect(
      checkVectors({
        repoRoot: repo,
        backendFile: missing,
        ci: true,
        vectorsUrl: "https://api.example/v.json",
        fetchImpl: async () => {
          throw new Error("offline");
        },
      }),
    ).rejects.toThrow(/could not fetch/);
  });

  it("fails loudly in CI when there is no source at all", async () => {
    const { repo, missing } = setup();
    await expect(checkVectors({ repoRoot: repo, backendFile: missing, ci: true })).rejects.toThrow(
      /NEWMA_VECTORS_URL/,
    );
  });

  it("allows a lock-only check in CI only when explicitly opted in, with a warning", async () => {
    const { repo, missing } = setup();
    const message = await checkVectors({
      repoRoot: repo,
      backendFile: missing,
      ci: true,
      allowLockOnly: true,
    });
    expect(message).toMatch(/::warning::/);
    expect(message).toMatch(/matches its lock/);
  });

  it("the sibling checkout still wins in CI when present", async () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    expect(await checkVectors({ repoRoot: repo, backendFile, ci: true })).toMatch(
      /matches the backend/,
    );
  });
});
