import { describe, expect, it } from "vitest";
import {
  CENTER,
  EDGES,
  GLYPH_KEYS,
  hitRadius,
  PARTS,
  STAGES,
  VIEWBOX,
} from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const stage = (id: (typeof STAGES)[number]["id"]) => STAGES.find((item) => item.id === id)!;

const insideStage = (
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number },
  pad = 0,
) =>
  point.x >= box.x - pad &&
  point.x <= box.x + box.width + pad &&
  point.y >= box.y - pad &&
  point.y <= box.y + box.height + pad;

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

  it("lays the six parts out as an input-core-validation pipeline", () => {
    const data = PARTS.find((p) => p.slug === "data-knowledge")!;
    const provenance = PARTS.find((p) => p.slug === "provenance-dlt")!;
    const gate = PARTS.find((p) => p.slug === "interface")!;
    const agentic = PARTS.find((p) => p.slug === "agentic-compute")!;
    const scientific = PARTS.find((p) => p.slug === "scientific-review")!;
    const wetLab = PARTS.find((p) => p.slug === "wet-lab")!;
    const input = stage("input");
    const core = stage("core");
    const validation = stage("validation");
    expect(data.shape).toBe("server");
    expect(provenance.shape).toBe("server");
    expect(gate.shape).toBe("twin");
    expect(STAGES.map((item) => item.id)).toEqual(["input", "core", "validation"]);
    expect(data.assembled.x).toBe(CENTER.x);
    expect(provenance.assembled.x).toBe(CENTER.x);
    expect(provenance.assembled.y).toBeLessThan(data.assembled.y);
    expect(provenance.exploded.y).toBeLessThan(provenance.assembled.y);
    expect(data.exploded.y).toBeGreaterThan(data.assembled.y);
    expect(insideStage(gate.assembled, input)).toBe(true);
    expect(gate.assembled.x).toBeLessThan(core.x);
    expect(gate.exploded.x).toBeLessThan(gate.assembled.x);
    expect(insideStage(agentic.assembled, core)).toBe(true);
    expect(insideStage(scientific.assembled, core)).toBe(true);
    expect(insideStage(data.assembled, core)).toBe(true);
    expect(insideStage(provenance.assembled, core)).toBe(true);
    expect(insideStage(wetLab.assembled, validation)).toBe(true);
    expect(agentic.assembled.x).toBeLessThan(scientific.assembled.x);
    expect(wetLab.exploded.x).toBeGreaterThan(wetLab.assembled.x);
    expect(wetLab.exploded.y - wetLab.assembled.y).toBeGreaterThan(36);
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
    expect(Object.isFrozen(STAGES)).toBe(true);
    for (const part of PARTS) {
      expect(Object.isFrozen(part)).toBe(true);
      expect(Object.isFrozen(part.assembled)).toBe(true);
      expect(Object.isFrozen(part.exploded)).toBe(true);
    }
    for (const edge of EDGES) expect(Object.isFrozen(edge)).toBe(true);
  });
});
