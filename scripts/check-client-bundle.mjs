#!/usr/bin/env node
// Client-bundle guard: measure the root chunks every page loads and fail if the Sentry browser SDK
// ships when NEXT_PUBLIC_SENTRY_DSN is unset (it must be zero-cost without a DSN).
// Usage: node scripts/check-client-bundle.mjs [nextDir]   (after `pnpm build`)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const SENTRY_MARKER = /@sentry\//;

export class BundleCheckError extends Error {}

/** @typedef {{ files: string[]; rawBytes: number; gzipBytes: number; sentryChunks: string[] }} BundleReport */

/** @param {string} nextDir @returns {BundleReport} */
export function measureRootChunks(nextDir) {
  const manifestPath = path.join(nextDir, "build-manifest.json");
  if (!existsSync(manifestPath)) {
    throw new BundleCheckError(`${manifestPath} not found; run pnpm build first`);
  }
  const files = JSON.parse(readFileSync(manifestPath, "utf8")).rootMainFiles ?? [];
  return files.reduce(
    (report, file) => {
      const bytes = readFileSync(path.join(nextDir, file));
      const hasSentry = SENTRY_MARKER.test(bytes.toString("utf8"));
      return {
        files: [...report.files, file],
        rawBytes: report.rawBytes + bytes.length,
        gzipBytes: report.gzipBytes + gzipSync(bytes).length,
        sentryChunks: hasSentry ? [...report.sentryChunks, file] : report.sentryChunks,
      };
    },
    { files: [], rawBytes: 0, gzipBytes: 0, sentryChunks: [] },
  );
}

/** @param {BundleReport} report @param {string | undefined} dsn */
export function assertNoSentryWithoutDsn(report, dsn) {
  if (!dsn?.trim() && report.sentryChunks.length > 0) {
    throw new BundleCheckError(
      `Sentry SDK is in the root client bundle without a DSN: ${report.sentryChunks.join(", ")}`,
    );
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  try {
    const report = measureRootChunks(process.argv[2] ?? path.join(process.cwd(), ".next"));
    assertNoSentryWithoutDsn(report, process.env.NEXT_PUBLIC_SENTRY_DSN);
    process.stdout.write(
      `bundle:check: ok (root chunks ${report.files.length}, ${report.rawBytes} B raw, ${report.gzipBytes} B gzip)\n`,
    );
  } catch (error) {
    if (!(error instanceof BundleCheckError)) throw error;
    process.stderr.write(`bundle:check: ${error.message}\n`);
    process.exit(1);
  }
}
