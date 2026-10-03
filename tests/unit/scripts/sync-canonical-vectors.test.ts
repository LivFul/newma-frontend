// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM script without types
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
  it("--write vendors the backend file and its lock; --check then passes", () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    expect(readFileSync(path.join(repo, "tests/fixtures/canonical/vectors.json"), "utf8")).toBe(
      VECTORS,
    );
    const lock = JSON.parse(
      readFileSync(path.join(repo, "tests/fixtures/canonical/vectors.lock"), "utf8"),
    );
    expect(lock.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkVectors({ repoRoot: repo, backendFile })).toMatch(/matches the backend/);
  });

  it("--check fails when the backend copy drifted", () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    writeFileSync(backendFile, VECTORS.replace('"a"', '"b"'));
    expect(() => checkVectors({ repoRoot: repo, backendFile })).toThrow(VectorsError);
  });

  it("--check without the sibling verifies the vendored file against the lock", () => {
    const { repo, backendFile } = sandbox();
    syncVectors({ repoRoot: repo, backendFile });
    const missing = path.join(repo, "no-such/vectors.json");
    expect(checkVectors({ repoRoot: repo, backendFile: missing })).toMatch(/matches its lock/);
    writeFileSync(path.join(repo, "tests/fixtures/canonical/vectors.json"), "[]\n");
    expect(() => checkVectors({ repoRoot: repo, backendFile: missing })).toThrow(/lock/);
  });

  it("--write fails without the backend file", () => {
    const { repo, backendFile } = sandbox({ backend: false });
    expect(() => syncVectors({ repoRoot: repo, backendFile })).toThrow(VectorsError);
  });
});
