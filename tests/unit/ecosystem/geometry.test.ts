import { describe, expect, it } from "vitest";
import {
  CENTER,
  EDGES,
  ELLIPSE,
  GLYPH_KEYS,
  hitRadius,
  PARTS,
  VIEWBOX,
} from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const onEllipse = (point: { x: number; y: number }, ring: { rx: number; ry: number }) => {
  const nx = (point.x - CENTER.x) / ring.rx;
  const ny = (point.y - CENTER.y) / ring.ry;
  return nx * nx + ny * ny;
};

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

  it("stacks the records server at the core and keeps Interface outside the loop", () => {
    const data = PARTS.find((p) => p.slug === "data-knowledge")!;
    const provenance = PARTS.find((p) => p.slug === "provenance-dlt")!;
    const gate = PARTS.find((p) => p.slug === "interface")!;
    expect(data.shape).toBe("server");
    expect(provenance.shape).toBe("server");
    expect(gate.shape).toBe("twin");
    expect(data.assembled.x).toBe(CENTER.x);
    expect(provenance.assembled.x).toBe(CENTER.x);
    expect(provenance.assembled.y).toBeLessThan(data.assembled.y);
    expect(provenance.exploded.y).toBeLessThan(provenance.assembled.y);
    expect(data.exploded.y).toBeGreaterThan(data.assembled.y);
    expect(gate.assembled.x).toBeLessThan(CENTER.x - ELLIPSE.assembled.rx);
    expect(gate.exploded.x).toBeLessThan(gate.assembled.x);
    for (const slug of ["agentic-compute", "scientific-review", "wet-lab"] as const) {
      const part = PARTS.find((p) => p.slug === slug)!;
      expect(onEllipse(part.assembled, ELLIPSE.assembled)).toBeCloseTo(1, 2);
      expect(onEllipse(part.exploded, ELLIPSE.exploded)).toBeCloseTo(1, 2);
      expect(dist(part.exploded, CENTER)).toBeGreaterThan(dist(part.assembled, CENTER));
    }
    const wetLab = PARTS.find((p) => p.slug === "wet-lab")!;
    expect(wetLab.exploded.y - wetLab.assembled.y).toBeGreaterThan(20);
  });

  it("never overlaps assembled or exploded nodes", () => {
    for (const state of ["assembled", "exploded"] as const) {
      const nodes = PARTS.map((p) => ({
        point: p[state],
        radius: hitRadius(p),
        slug: p.slug,
      }));
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          expect(
            dist(nodes[i]!.point, nodes[j]!.point),
            `${nodes[i]!.slug} vs ${nodes[j]!.slug} ${state}`,
          ).toBeGreaterThan(nodes[i]!.radius + nodes[j]!.radius);
        }
      }
    }
  });

  it("keeps every node, assembled and exploded, inside the viewBox", () => {
    for (const part of PARTS) {
      const radius = hitRadius(part);
      for (const point of [part.assembled, part.exploded]) {
        expect(point.x - radius).toBeGreaterThanOrEqual(0);
        expect(point.y - radius).toBeGreaterThanOrEqual(0);
        expect(point.x + radius).toBeLessThanOrEqual(VIEWBOX.width);
        expect(point.y + radius).toBeLessThanOrEqual(VIEWBOX.height);
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
