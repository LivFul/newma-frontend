import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The `radix-ui` barrel drags every primitive (popper included, ~18 KB gzip) into a client chunk;
// subpath imports keep a route's first-load weight to what it uses (W10 budget, A-P5B-16).
const SRC = path.join(import.meta.dirname, "..", "..", "src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("radix imports", () => {
  it("never import the radix-ui barrel", () => {
    const offenders = files(SRC).filter((file) =>
      /from\s+["']radix-ui["']/.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
