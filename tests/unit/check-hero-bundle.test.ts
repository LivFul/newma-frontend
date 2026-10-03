import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { HERO_CHUNK_MARKER } from "@/components/ecosystem-graphic/hero-marker";
import {
  HERO_BUDGET_BYTES,
  HERO_MARKER,
  HeroBundleError,
  measureHeroChunks,
} from "../../scripts/check-hero-bundle.mjs";

const dirs: string[] = [];
const MARKER = "newma-hero-chunk";

/** A synthetic .next tree: one root chunk, one shared chunk, two hero chunks (one with the marker). */
function tree(
  options: { marker?: boolean; heroFiles?: string[]; sharedInManifest?: boolean } = {},
) {
  const {
    marker = true,
    heroFiles = ["hero-a.js", "hero-b.js"],
    sharedInManifest = true,
  } = options;
  const dir = mkdtempSync(path.join(os.tmpdir(), "hero-"));
  dirs.push(dir);
  const write = (rel: string, content: Buffer | string) => {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), content);
  };
  const chunk = (name: string, withMarker = false) =>
    write(
      `static/chunks/${name}`,
      Buffer.concat([Buffer.from(withMarker ? MARKER : "x"), randomBytes(4000)]),
    );
  chunk("root.js");
  chunk("shared.js");
  chunk("hero-a.js", marker);
  chunk("hero-b.js");
  write("static/chunks/hero.css", "a{color:red}");
  write(
    "build-manifest.json",
    JSON.stringify({ rootMainFiles: ["static/chunks/root.js"], polyfillFiles: [] }),
  );
  write(
    "server/app/(site)/page/react-loadable-manifest.json",
    JSON.stringify({
      "1": {
        id: 1,
        files: [
          ...heroFiles.map((f) => `static/chunks/${f}`),
          ...(sharedInManifest ? ["static/chunks/shared.js", "static/chunks/root.js"] : []),
          "static/chunks/hero.css",
        ],
      },
    }),
  );
  write(
    "server/app/(site)/page_client-reference-manifest.js",
    'globalThis.__RSC_MANIFEST = {"chunks":["static/chunks/shared.js"]};',
  );
  return dir;
}
const gz = (dir: string, file: string) =>
  gzipSync(readFileSync(path.join(dir, "static/chunks", file))).length;

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("measureHeroChunks", () => {
  it("reports files, raw bytes and gzip bytes of the chunks only the hero loads", () => {
    const dir = tree();
    const report = measureHeroChunks(dir);
    expect(report.files.map((f: { file: string }) => f.file).sort()).toEqual([
      "static/chunks/hero-a.js",
      "static/chunks/hero-b.js",
    ]);
    expect(report.rawBytes).toBe(2 * (4000 + 1) + (MARKER.length - 1));
    expect(report.gzipBytes).toBe(gz(dir, "hero-a.js") + gz(dir, "hero-b.js"));
    expect(
      report.files.every(
        (f: { rawBytes: number; gzipBytes: number }) => f.rawBytes > 4000 && f.gzipBytes > 0,
      ),
    ).toBe(true);
  });

  it("ignores root and shared chunks and non-JS files", () => {
    const report = measureHeroChunks(tree());
    const names = report.files.map((f: { file: string }) => f.file).join(" ");
    expect(names).not.toMatch(/root|shared|\.css/);
  });

  it("fails with HeroBundleError above the budget and passes just under it", () => {
    const dir = tree();
    const exact = measureHeroChunks(dir).gzipBytes;
    expect(() => measureHeroChunks(dir, { budget: exact - 1 })).toThrow(HeroBundleError);
    expect(measureHeroChunks(dir, { budget: exact }).gzipBytes).toBe(exact);
    expect(() => measureHeroChunks(dir, { budget: exact - 1 })).toThrow(/over the budget/);
  });

  it("fails when no hero chunk is found, so a refactor cannot silently pass", () => {
    expect(() => measureHeroChunks(tree({ heroFiles: [] }))).toThrow(HeroBundleError);
    expect(() => measureHeroChunks(tree({ heroFiles: [] }))).toThrow(/no hero chunk/i);
  });

  it("fails when no hero chunk carries the marker", () => {
    expect(() => measureHeroChunks(tree({ marker: false }))).toThrow(/marker/i);
  });

  it("fails clearly when the build output is missing", () => {
    expect(() => measureHeroChunks(path.join(os.tmpdir(), "no-such-next-dir"))).toThrow(
      /pnpm build/,
    );
  });

  it("searches for the same marker the hero chunk carries", () => {
    expect(HERO_MARKER).toBe(HERO_CHUNK_MARKER);
  });

  it("uses the 80 KiB budget from the sprint prompt", () => {
    expect(HERO_BUDGET_BYTES).toBe(81_920);
  });
});
