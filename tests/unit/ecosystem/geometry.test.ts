import { describe, expect, it } from "vitest";
import {
  EDGES,
  GLYPH_KEYS,
  LABEL_BOX,
  PARTS,
  PLATE,
  VIEWBOX,
  type Point,
} from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

type Box = { left: number; top: number; right: number; bottom: number };

const plateBox = (p: Point): Box => ({
  left: p.x - PLATE.halfWidth,
  right: p.x + PLATE.halfWidth,
  top: p.y - PLATE.halfHeight,
  bottom: p.y + PLATE.halfHeight + PLATE.thickness,
});
const labelBox = (p: Point): Box => ({
  left: p.x + LABEL_BOX.offsetX,
  right: p.x + LABEL_BOX.offsetX + LABEL_BOX.width,
  top: p.y + LABEL_BOX.top,
  bottom: p.y + LABEL_BOX.bottom,
});
const union = (a: Box, b: Box): Box => ({
  left: Math.min(a.left, b.left),
  right: Math.max(a.right, b.right),
  top: Math.min(a.top, b.top),
  bottom: Math.max(a.bottom, b.bottom),
});
const GAP = 8;
const overlaps = (a: Box, b: Box) =>
  a.left < b.right + GAP &&
  b.left < a.right + GAP &&
  a.top < b.bottom + GAP &&
  b.top < a.bottom + GAP;
const inside = (b: Box) =>
  b.left >= 0 && b.top >= 0 && b.right <= VIEWBOX.width && b.bottom <= VIEWBOX.height;

describe("ecosystem geometry", () => {
  it("has six parts with the exact slugs in order", () => {
    expect(PARTS.map((p) => p.slug)).toEqual([...ECOSYSTEM_SLUGS]);
  });

  it("every edge references existing slugs", () => {
    const slugs = new Set<string>(ECOSYSTEM_SLUGS);
    expect(EDGES.length).toBeGreaterThan(0);
    for (const edge of EDGES) {
      expect(slugs.has(edge.from), edge.id).toBe(true);
      expect(slugs.has(edge.to), edge.id).toBe(true);
      expect(edge.d.length).toBeGreaterThan(0);
    }
  });

  it("encodes the TA section 1 flow", () => {
    const flow = EDGES.filter((e) => e.kind === "flow").map((e) => `${e.from}>${e.to}`);
    expect(flow).toEqual([
      "interface>agentic-compute",
      "agentic-compute>scientific-review",
      "agentic-compute>wet-lab",
      "wet-lab>scientific-review",
    ]);
    const rail = EDGES.filter((e) => e.kind === "rail");
    expect(rail.map((e) => e.from)).toEqual([
      "interface",
      "agentic-compute",
      "scientific-review",
      "wet-lab",
    ]);
    expect(rail.every((e) => e.to === "data-knowledge")).toBe(true);
  });

  it("draws the provenance part and its edge dashed, and nothing else", () => {
    const dashedParts = PARTS.filter((p) => p.dashed).map((p) => p.slug);
    expect(dashedParts).toEqual(["provenance-dlt"]);
    const dashedEdges = EDGES.filter((e) => e.dashed);
    expect(dashedEdges.map((e) => `${e.from}>${e.to}`)).toEqual(["data-knowledge>provenance-dlt"]);
    expect(dashedEdges[0]?.kind).toBe("optional");
  });

  it("gives every part a distinct glyph", () => {
    expect(new Set(PARTS.map((p) => p.glyph)).size).toBe(6);
    for (const part of PARTS) expect(GLYPH_KEYS).toContain(part.glyph);
  });

  it("never overlaps exploded parts (plate plus label box, 8-unit gap)", () => {
    const boxes = PARTS.map((p) => union(plateBox(p.exploded), labelBox(p.exploded)));
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(overlaps(boxes[i]!, boxes[j]!), `${PARTS[i]!.slug} vs ${PARTS[j]!.slug}`).toBe(
          false,
        );
      }
    }
  });

  it("keeps every position, assembled and exploded, inside the viewBox", () => {
    for (const part of PARTS) {
      for (const point of [part.assembled, part.exploded]) {
        expect(inside(union(plateBox(point), labelBox(point))), part.slug).toBe(true);
      }
    }
  });

  it("is deeply frozen", () => {
    expect(Object.isFrozen(PARTS)).toBe(true);
    expect(Object.isFrozen(EDGES)).toBe(true);
    expect(Object.isFrozen(VIEWBOX)).toBe(true);
    for (const part of PARTS) {
      expect(Object.isFrozen(part)).toBe(true);
      expect(Object.isFrozen(part.assembled)).toBe(true);
      expect(Object.isFrozen(part.exploded)).toBe(true);
    }
    for (const edge of EDGES) expect(Object.isFrozen(edge)).toBe(true);
  });

  it("separates parts vertically when exploded and keeps assembled parts stacked", () => {
    const assembledSpan = PARTS.at(-1)!.assembled.y - PARTS[0]!.assembled.y;
    const explodedSpan = PARTS.at(-1)!.exploded.y - PARTS[0]!.exploded.y;
    expect(explodedSpan).toBeGreaterThan(assembledSpan * 2);
    for (let i = 1; i < PARTS.length; i += 1) {
      expect(PARTS[i]!.exploded.y).toBeGreaterThan(PARTS[i - 1]!.exploded.y);
      expect(PARTS[i]!.assembled.y).toBeGreaterThan(PARTS[i - 1]!.assembled.y);
    }
  });
});
