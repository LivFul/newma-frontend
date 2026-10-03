#!/usr/bin/env node
// Canonical-JSON vector sync (A-P3-20). The backend repo is private, so CI cannot fetch it:
//   --write  copy ../newma-backend/fixtures/canonical/vectors.json into tests/fixtures/canonical/
//            and record its SHA-256 in vectors.lock
//   --check  with the sibling checkout: the vendored bytes must equal the backend file;
//            without it: the vendored file must match its lock.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export class VectorsError extends Error {}

const VENDORED = "tests/fixtures/canonical/vectors.json";
const LOCK = "tests/fixtures/canonical/vectors.lock";
const DEFAULT_BACKEND = "../newma-backend/fixtures/canonical/vectors.json";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function paths(repoRoot, backendFile) {
  return {
    vendored: path.join(repoRoot, VENDORED),
    lock: path.join(repoRoot, LOCK),
    backend: backendFile ?? path.resolve(repoRoot, DEFAULT_BACKEND),
  };
}

/** @param {{ repoRoot: string, backendFile?: string }} options */
export function syncVectors({ repoRoot, backendFile }) {
  const p = paths(repoRoot, backendFile);
  if (!existsSync(p.backend)) throw new VectorsError(`backend vectors not found at ${p.backend}`);
  const bytes = readFileSync(p.backend);
  writeFileSync(p.vendored, bytes);
  writeFileSync(
    p.lock,
    `${JSON.stringify({ source: DEFAULT_BACKEND, sha256: sha256(bytes) }, null, 2)}\n`,
  );
  return `vectors: vendored ${sha256(bytes).slice(0, 12)}`;
}

const FETCH_TIMEOUT_MS = 15_000;

async function fetchDeployed(url, fetchImpl) {
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new VectorsError(`could not fetch the deployed vectors from ${url}: ${error.message}`);
  }
}

/**
 * Drift check. Source order: sibling backend checkout, then NEWMA_VECTORS_URL (the deployed
 * API's /canonical-vectors.json), then the lock alone. In CI the lock alone is never silent: it
 * fails unless `allowLockOnly` is set, in which case it emits a GitHub warning.
 */
/**
 * @param {{ repoRoot: string, backendFile?: string, ci?: boolean, vectorsUrl?: string,
 *   allowLockOnly?: boolean, fetchImpl?: typeof fetch }} options
 * @returns {Promise<string>}
 */
export async function checkVectors({
  repoRoot,
  backendFile,
  ci = false,
  vectorsUrl,
  allowLockOnly = false,
  fetchImpl = fetch,
}) {
  const p = paths(repoRoot, backendFile);
  if (!existsSync(p.vendored)) throw new VectorsError(`vendored vectors missing at ${VENDORED}`);
  const vendored = readFileSync(p.vendored);
  const lock = JSON.parse(readFileSync(p.lock, "utf8"));
  if (lock.sha256 !== sha256(vendored)) {
    throw new VectorsError("vendored vectors do not match vectors.lock; run pnpm vectors:sync");
  }
  if (existsSync(p.backend)) {
    if (!readFileSync(p.backend).equals(vendored)) {
      throw new VectorsError("canonical vectors drifted from the backend; run pnpm vectors:sync");
    }
    return "vectors: vendored file matches the backend";
  }
  if (vectorsUrl) {
    const deployed = await fetchDeployed(vectorsUrl, fetchImpl);
    if (!deployed.equals(vendored)) {
      throw new VectorsError(
        `canonical vectors drifted from the deployed API (${vectorsUrl}); run pnpm vectors:sync against the backend`,
      );
    }
    return "vectors: vendored file matches the deployed API";
  }
  if (ci && !allowLockOnly) {
    throw new VectorsError(
      "no backend vectors source in CI: set the NEWMA_VECTORS_URL repository variable (the deployed API's /canonical-vectors.json) so drift cannot pass silently",
    );
  }
  const note = ci
    ? "::warning::canonical vectors checked against the lock only (NEWMA_VECTORS_URL is not set). "
    : "";
  return `${note}vectors: vendored file matches its lock (no backend source)`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const repoRoot = process.cwd();
  try {
    const message = process.argv.includes("--write")
      ? syncVectors({ repoRoot })
      : await checkVectors({
          repoRoot,
          ci: process.env.CI === "true",
          vectorsUrl: process.env.NEWMA_VECTORS_URL || undefined,
          allowLockOnly: process.env.VECTORS_ALLOW_LOCK_ONLY === "1",
        });
    console.log(message);
  } catch (error) {
    console.error(error instanceof VectorsError ? error.message : error);
    process.exit(1);
  }
}
