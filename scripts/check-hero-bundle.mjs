#!/usr/bin/env node
// Hero JS budget (prompt 3.6, D-04): the client chunks that load only because of the hero's dynamic
// import must stay within 80 KiB gzip. Usage: node scripts/check-hero-bundle.mjs [nextDir]
// (after `pnpm build`).
//
// Spike result (Task 8, assumption A-P4-14). How the hero chunks are found in `.next`:
//   1. `server/app/(site)/page/react-loadable-manifest.json` lists the files of every `next/dynamic`
//      import on the home page. The hero loader has exactly one (`./interactive`), so its closure,
//      Motion included, is listed there. This is the primary source.
//   2. Chunks that are also first-load (named in `build-manifest.json` rootMainFiles and polyfills, or
//      in the page's client-reference manifest) are shared, not hero-only, and are subtracted.
//   3. The literal HERO_CHUNK_MARKER (src/components/ecosystem-graphic/hero-marker.ts) must appear in at
//      least one remaining chunk. This proves the manifest entry really is the hero and not some other
//      lazy import that a refactor swapped in.
// An empty result is an error, so removing the lazy import cannot silently pass the budget.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

export class HeroBundleError extends Error {}

export const HERO_BUDGET_BYTES = 81_920;
export const HERO_MARKER = "newma-hero-chunk";
const HOME_ROUTE = "(site)/page";
const JS_CHUNK = /static\/chunks\/[A-Za-z0-9_~.-]+\.js/g;

const readText = (file) => readFileSync(file, "utf8");

/** Chunks every page of the route loads up front: root files and the page's own client references. */
function firstLoadChunks(nextDir, route) {
  const build = JSON.parse(readText(path.join(nextDir, "build-manifest.json")));
  const shared = new Set([...(build.rootMainFiles ?? []), ...(build.polyfillFiles ?? [])]);
  const reference = path.join(nextDir, "server/app", `${route}_client-reference-manifest.js`);
  if (existsSync(reference))
    for (const file of readText(reference).match(JS_CHUNK) ?? []) shared.add(file);
  return shared;
}

function dynamicChunks(nextDir, route) {
  const manifest = path.join(nextDir, "server/app", route, "react-loadable-manifest.json");
  if (!existsSync(manifest)) {
    throw new HeroBundleError(`${manifest} not found; run pnpm build first`);
  }
  const entries = Object.values(JSON.parse(readText(manifest)));
  return new Set(
    entries.flatMap((entry) => entry.files ?? []).filter((file) => file.endsWith(".js")),
  );
}

/**
 * @param {string} nextDir
 * @param {{ budget?: number; marker?: string; route?: string }} [options]
 */
export function measureHeroChunks(
  nextDir,
  { budget = HERO_BUDGET_BYTES, marker = HERO_MARKER, route = HOME_ROUTE } = {},
) {
  if (!existsSync(path.join(nextDir, "build-manifest.json"))) {
    throw new HeroBundleError(
      `${path.join(nextDir, "build-manifest.json")} not found; run pnpm build first`,
    );
  }
  const shared = firstLoadChunks(nextDir, route);
  const hero = [...dynamicChunks(nextDir, route)].filter((file) => !shared.has(file));
  if (hero.length === 0) {
    throw new HeroBundleError(
      "no hero chunk found: the home page has no lazily loaded chunk of its own",
    );
  }
  const files = hero.map((file) => {
    const bytes = readFileSync(path.join(nextDir, file));
    return {
      file,
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes).length,
      hasMarker: bytes.includes(marker),
    };
  });
  if (!files.some((f) => f.hasMarker)) {
    throw new HeroBundleError(
      `no hero chunk contains the marker "${marker}"; the lazy import is not the hero`,
    );
  }
  const gzipBytes = files.reduce((sum, f) => sum + f.gzipBytes, 0);
  const rawBytes = files.reduce((sum, f) => sum + f.rawBytes, 0);
  if (gzipBytes > budget) {
    throw new HeroBundleError(`hero JS is ${gzipBytes} B gzip, over the budget of ${budget} B`);
  }
  return { files, rawBytes, gzipBytes, budget };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  try {
    const report = measureHeroChunks(process.argv[2] ?? path.join(process.cwd(), ".next"));
    process.stdout.write(
      `hero:check: ok (${report.files.length} chunks, ${report.rawBytes} B raw, ${report.gzipBytes} B gzip of ${report.budget})\n`,
    );
  } catch (error) {
    if (!(error instanceof HeroBundleError)) throw error;
    process.stderr.write(`hero:check: ${error.message}\n`);
    process.exit(1);
  }
}
