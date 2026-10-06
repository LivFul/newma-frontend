import { describe, expect, it } from "vitest";
import {
  CENTER,
  EDGES,
  GLYPH_KEYS,
  NODE_RADIUS,
  PARTS,
  RING,
  VIEWBOX,
} from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

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

  it("keeps Interface at the centre and the others on two rings", () => {
    const hub = PARTS.find((p) => p.slug === "interface")!;
    expect(hub.center).toBe(true);
    expect(hub.assembled).toEqual(CENTER);
    expect(hub.exploded).toEqual(CENTER);
    for (const part of PARTS.filter((p) => !p.center)) {
      expect(dist(part.assembled, CENTER)).toBeCloseTo(RING.assembled, 0);
      expect(dist(part.exploded, CENTER)).toBeCloseTo(RING.exploded, 0);
      expect(dist(part.exploded, CENTER)).toBeGreaterThan(dist(part.assembled, CENTER));
    }
  });

  it("never overlaps exploded nodes", () => {
    const nodes = PARTS.map((p) => p.exploded);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        expect(dist(nodes[i]!, nodes[j]!)).toBeGreaterThan(NODE_RADIUS * 2);
      }
    }
  });

  it("keeps every node, assembled and exploded, inside the viewBox", () => {
    for (const part of PARTS) {
      for (const point of [part.assembled, part.exploded]) {
        expect(point.x - NODE_RADIUS).toBeGreaterThanOrEqual(0);
        expect(point.y - NODE_RADIUS).toBeGreaterThanOrEqual(0);
        expect(point.x + NODE_RADIUS).toBeLessThanOrEqual(VIEWBOX.width);
        expect(point.y + NODE_RADIUS).toBeLessThanOrEqual(VIEWBOX.height);
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
});
