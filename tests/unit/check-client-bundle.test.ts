import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BundleCheckError,
  assertNoSentryWithoutDsn,
  measureRootChunks,
} from "../../scripts/check-client-bundle.mjs";

/** Build a fake `.next` directory with the given root chunks (name -> content). */
function fakeNext(chunks: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bundle-"));
  mkdirSync(path.join(dir, "static/chunks"), { recursive: true });
  const rootMainFiles = Object.keys(chunks).map((name) => `static/chunks/${name}`);
  for (const [name, content] of Object.entries(chunks)) {
    writeFileSync(path.join(dir, "static/chunks", name), content);
  }
  writeFileSync(path.join(dir, "build-manifest.json"), JSON.stringify({ rootMainFiles }));
  return dir;
}

describe("measureRootChunks", () => {
  it("sums raw and gzip bytes over the root chunks and flags Sentry-bearing ones", () => {
    const dir = fakeNext({ "a.js": "x".repeat(1000), "b.js": 'import("@sentry/nextjs")' });
    const report = measureRootChunks(dir);
    expect(report.files).toEqual(["static/chunks/a.js", "static/chunks/b.js"]);
    expect(report.rawBytes).toBe(1000 + 'import("@sentry/nextjs")'.length);
    expect(report.gzipBytes).toBeGreaterThan(0);
    expect(report.gzipBytes).toBeLessThan(report.rawBytes);
    expect(report.sentryChunks).toEqual(["static/chunks/b.js"]);
  });
  it("throws a BundleCheckError when the build manifest is missing", () => {
    expect(() => measureRootChunks(mkdtempSync(path.join(tmpdir(), "empty-")))).toThrow(
      BundleCheckError,
    );
  });
});

describe("assertNoSentryWithoutDsn", () => {
  const clean = { files: [], rawBytes: 0, gzipBytes: 0, sentryChunks: [] as string[] };
  it("passes when no Sentry chunk is in the root bundle", () => {
    expect(() => assertNoSentryWithoutDsn(clean, undefined)).not.toThrow();
  });
  it("fails when Sentry ships in the root bundle and no DSN is configured", () => {
    const report = { ...clean, sentryChunks: ["static/chunks/b.js"] };
    expect(() => assertNoSentryWithoutDsn(report, "")).toThrow(/without a DSN/);
  });
  it("allows Sentry in the root bundle when a DSN is configured", () => {
    const report = { ...clean, sentryChunks: ["static/chunks/b.js"] };
    expect(() => assertNoSentryWithoutDsn(report, "https://k@o.ingest.sentry.io/1")).not.toThrow();
  });
});
