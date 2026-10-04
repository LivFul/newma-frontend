import { describe, expect, it } from "vitest";
import {
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NOTE_TEXT,
} from "@/content/home/workflow";
import { textsOf } from "@/lib/workflow/copy";
import { SVG_TEXT } from "@/lib/workflow/footprints";
import { buildSvgLayout } from "@/lib/workflow/svg-layout";
import { WORKFLOW_EDGES, WORKFLOW_NODES, WORKFLOW_NOTES } from "@/lib/workflow/graph";

const layout = buildSvgLayout({
  nodeLabels: textsOf(WORKFLOW_NODE_LABELS),
  edgeLabels: textsOf(WORKFLOW_EDGE_LABELS),
  noteText: textsOf(WORKFLOW_NOTE_TEXT),
});

const numbersIn = (d: string): number[] => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("buildSvgLayout", () => {
  it("draws one shape per node, edge and note, in graph order", () => {
    expect(layout.nodes.map((n) => n.id)).toEqual(WORKFLOW_NODES.map((n) => n.id));
    expect(layout.edges.map((e) => e.id)).toEqual(WORKFLOW_EDGES.map((e) => e.id));
    expect(layout.notes.map((n) => n.id)).toEqual(WORKFLOW_NOTES.map((n) => n.id));
  });

  it("keeps every shape inside the view box", () => {
    const inside = (x: number, y: number) =>
      x >= 0 && y >= 0 && x <= layout.width && y <= layout.height;
    for (const node of layout.nodes) {
      expect(inside(node.cx - node.width / 2, node.cy - node.height / 2), node.id).toBe(true);
      expect(inside(node.cx + node.width / 2, node.cy + node.height / 2), node.id).toBe(true);
    }
    for (const note of layout.notes) {
      expect(inside(note.x, note.y), note.id).toBe(true);
      expect(inside(note.x + note.width, note.y + note.height), note.id).toBe(true);
    }
    for (const edge of layout.edges) {
      const values = numbersIn(edge.d);
      for (let i = 0; i < values.length; i += 2) {
        expect(inside(values[i]!, values[i + 1]!), edge.id).toBe(true);
      }
    }
  });

  it("keeps the labels beside the start and end circles inside the view box too", () => {
    for (const node of layout.nodes.filter((n) => n.kind === "start" || n.kind === "end")) {
      const label = WORKFLOW_NODE_LABELS[node.id]!.text;
      const right =
        node.cx + node.width / 2 + SVG_TEXT.besideGapPx + label.length * SVG_TEXT.charPx;
      expect(right, node.id).toBeLessThanOrEqual(layout.width);
    }
  });

  it("writes every route as a finite path that starts with a move command", () => {
    for (const edge of layout.edges) {
      expect(edge.d.startsWith("M"), edge.id).toBe(true);
      expect(edge.d, edge.id).not.toMatch(/NaN|Infinity/);
      expect(numbersIn(edge.d).length % 2, edge.id).toBe(0);
    }
  });

  it("carries each node's wrapped label lines and each transition's tone and label", () => {
    const acceptance = layout.nodes.find((n) => n.id === "acceptance")!;
    expect(acceptance.lines.join(" ")).toBe(WORKFLOW_NODE_LABELS.acceptance!.text);
    const labelled = layout.edges.find((e) => e.id === "rights-hold")!;
    expect(labelled.label).toBe(WORKFLOW_EDGE_LABELS["rights-hold"]!.text);
    expect(layout.edges.find((e) => e.id === "start-rights")!.label).toBeUndefined();
    expect(labelled.tone).toBe("remediate");
  });

  it("gives the hold node a hexagon and the notes a leader line to their node", () => {
    expect(layout.nodes.find((n) => n.id === "hold")!.hexagon).toMatch(/^[\d., -]+$/);
    expect(layout.nodes.find((n) => n.id === "rights")!.hexagon).toBeUndefined();
    for (const note of layout.notes) {
      expect(Object.values(note.leader).every(Number.isFinite), note.id).toBe(true);
    }
  });

  it("reports an aspect ratio matching the view box", () => {
    expect(layout.aspect).toBe(`${layout.width} / ${layout.height}`);
    expect(layout.width).toBeGreaterThan(layout.height * 0.9);
  });
});
