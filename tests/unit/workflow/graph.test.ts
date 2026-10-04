import { describe, expect, it } from "vitest";
import {
  WORKFLOW_EDGE_LABELS,
  WORKFLOW_LANE_NAMES,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NOTE_TEXT,
  WORKFLOW_TONE_NAMES,
} from "@/content/home/workflow";
import {
  node3dBox,
  NOTE_3D_HALF,
  svgNodeSize,
  svgNoteSize,
  SVG_SCALE,
} from "@/lib/workflow/footprints";
import { planRoute, segmentCrossesBox, type Footprint } from "@/lib/workflow/geometry";
import {
  WORKFLOW_EDGES,
  WORKFLOW_LANES,
  WORKFLOW_NODES,
  WORKFLOW_NOTES,
  nodeById,
} from "@/lib/workflow/graph";

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);
const label = (id: string) => WORKFLOW_NODE_LABELS[id]!.text;

interface Layout {
  readonly name: string;
  readonly nodes: Map<string, Footprint>;
  readonly notes: Footprint[];
  /** Shortest last run a route needs so its arrowhead has room, in world units per axis. */
  readonly minArrow: { readonly x: number; readonly z: number };
}

const MIN_ARROW_3D = 0.5;
const MIN_ARROW_SVG_PX = 12;

const layout3d: Layout = {
  name: "3D footprints",
  nodes: new Map(
    WORKFLOW_NODES.map((node) => [
      node.id,
      { center: { x: node.x, z: node.z }, box: node3dBox(node.kind, label(node.id)) },
    ]),
  ),
  notes: WORKFLOW_NOTES.map((note) => ({ center: { x: note.x, z: note.z }, box: NOTE_3D_HALF })),
  minArrow: { x: MIN_ARROW_3D, z: MIN_ARROW_3D },
};

const layoutSvg: Layout = {
  name: "SVG footprints",
  nodes: new Map(
    WORKFLOW_NODES.map((node) => [
      node.id,
      { center: { x: node.x, z: node.z }, box: svgNodeSize(node.kind, label(node.id)).box },
    ]),
  ),
  notes: WORKFLOW_NOTES.map((note) => ({
    center: { x: note.x, z: note.z },
    box: svgNoteSize(WORKFLOW_NOTE_TEXT[note.id]!.text).box,
  })),
  minArrow: { x: MIN_ARROW_SVG_PX / SVG_SCALE.x, z: MIN_ARROW_SVG_PX / SVG_SCALE.z },
};

describe("workflow graph integrity", () => {
  it("uses unique ids for nodes, edges and notes", () => {
    for (const group of [WORKFLOW_NODES, WORKFLOW_EDGES, WORKFLOW_NOTES]) {
      expect(new Set(ids(group)).size).toBe(group.length);
    }
  });

  it("connects only nodes that exist and attaches notes only to nodes that exist", () => {
    for (const edge of WORKFLOW_EDGES) {
      expect(nodeById(edge.from), `${edge.id} from`).toBeDefined();
      expect(nodeById(edge.to), `${edge.id} to`).toBeDefined();
      expect(edge.from, `${edge.id} is a self-loop`).not.toBe(edge.to);
    }
    for (const note of WORKFLOW_NOTES) expect(nodeById(note.attachTo), note.id).toBeDefined();
  });

  it("places every node in a known lane", () => {
    const lanes = new Set(WORKFLOW_LANES.map((lane) => lane.id));
    for (const node of WORKFLOW_NODES) expect(lanes.has(node.lane), node.id).toBe(true);
  });

  it("gives the start no incoming step, the end no outgoing step and every other node both", () => {
    for (const node of WORKFLOW_NODES) {
      const incoming = WORKFLOW_EDGES.filter((edge) => edge.to === node.id).length;
      const outgoing = WORKFLOW_EDGES.filter((edge) => edge.from === node.id).length;
      if (node.kind !== "start") expect(incoming, `${node.id} incoming`).toBeGreaterThan(0);
      if (node.kind !== "end") expect(outgoing, `${node.id} outgoing`).toBeGreaterThan(0);
      if (node.kind === "start") expect(incoming).toBe(0);
      if (node.kind === "end") expect(outgoing).toBe(0);
    }
  });
});

describe("workflow copy covers the graph", () => {
  it("has a label for every node and none for a node that does not exist", () => {
    expect(Object.keys(WORKFLOW_NODE_LABELS).sort()).toEqual(ids(WORKFLOW_NODES).sort());
  });
  it("labels only transitions that exist", () => {
    const known = new Set(ids(WORKFLOW_EDGES));
    for (const id of Object.keys(WORKFLOW_EDGE_LABELS)) expect(known.has(id), id).toBe(true);
  });
  it("has note text for every note", () => {
    expect(Object.keys(WORKFLOW_NOTE_TEXT).sort()).toEqual(ids(WORKFLOW_NOTES).sort());
  });
  it("names every lane and every transition kind in use", () => {
    for (const lane of WORKFLOW_LANES) expect(WORKFLOW_LANE_NAMES[lane.id], lane.id).toBeDefined();
    for (const tone of new Set(WORKFLOW_EDGES.map((edge) => edge.tone))) {
      expect(WORKFLOW_TONE_NAMES[tone], tone).toBeDefined();
    }
  });
});

describe.each([layout3d, layoutSvg])("route layout with $name", (layout) => {
  const routes = WORKFLOW_EDGES.map((edge) => ({
    edge,
    points: planRoute(edge.route, layout.nodes.get(edge.from)!, layout.nodes.get(edge.to)!),
  }));

  it("draws every route with right angles only", () => {
    for (const { edge, points } of routes) {
      expect(points.length, edge.id).toBeGreaterThanOrEqual(2);
      points.slice(1).forEach((point, i) => {
        const before = points[i]!;
        const straight = Math.abs(point.x - before.x) < 1e-6 || Math.abs(point.z - before.z) < 1e-6;
        expect(straight, `${edge.id} segment ${i}`).toBe(true);
      });
    }
  });

  it("leaves and enters every node perpendicular to the side its port is on", () => {
    // Running along an edge is allowed (that is how a route touches its own node), so without this a
    // tangential arrow would pass every other check.
    const vertical = (side: string) => side === "N" || side === "S";
    for (const { edge, points } of routes) {
      const first = points[0]!;
      const second = points[1]!;
      const penultimate = points[points.length - 2]!;
      const last = points[points.length - 1]!;
      const [exitSide] = edge.route.exit;
      const [enterSide] = edge.route.enter;
      const leavesVertically = Math.abs(first.x - second.x) < 1e-6;
      const entersVertically = Math.abs(penultimate.x - last.x) < 1e-6;
      expect(leavesVertically, `${edge.id} exit ${exitSide}`).toBe(vertical(exitSide));
      expect(entersVertically, `${edge.id} enter ${enterSide}`).toBe(vertical(enterSide));
      // And it heads away from the node it leaves, towards the node it enters.
      if (exitSide === "S") expect(second.z, edge.id).toBeGreaterThan(first.z);
      if (exitSide === "N") expect(second.z, edge.id).toBeLessThan(first.z);
      if (exitSide === "E") expect(second.x, edge.id).toBeGreaterThan(first.x);
      if (exitSide === "W") expect(second.x, edge.id).toBeLessThan(first.x);
      if (enterSide === "N") expect(last.z, edge.id).toBeGreaterThan(penultimate.z);
      if (enterSide === "S") expect(last.z, edge.id).toBeLessThan(penultimate.z);
      if (enterSide === "E") expect(last.x, edge.id).toBeLessThan(penultimate.x);
      if (enterSide === "W") expect(last.x, edge.id).toBeGreaterThan(penultimate.x);
    }
  });

  it("leaves room for the arrowhead on the last run of every route", () => {
    for (const { edge, points } of routes) {
      const last = points[points.length - 1]!;
      const before = points[points.length - 2]!;
      const run = Math.max(
        Math.abs(last.x - before.x) / layout.minArrow.x,
        Math.abs(last.z - before.z) / layout.minArrow.z,
      );
      expect(run, edge.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("never lets a route cut through a node or a note", () => {
    const obstacles = [
      ...[...layout.nodes].map(([id, footprint]) => ({ id, footprint })),
      ...layout.notes.map((footprint, i) => ({ id: `note ${i}`, footprint })),
    ];
    for (const { edge, points } of routes) {
      points.slice(1).forEach((point, i) => {
        for (const obstacle of obstacles) {
          expect(
            segmentCrossesBox(points[i]!, point, obstacle.footprint),
            `${edge.id} crosses ${obstacle.id}`,
          ).toBe(false);
        }
      });
    }
  });

  it("keeps nodes and notes from overlapping each other", () => {
    const boxes = [
      ...[...layout.nodes].map(([id, f]) => ({ id, ...f })),
      ...layout.notes.map((f, i) => ({ id: `note ${i}`, ...f })),
    ];
    for (let a = 0; a < boxes.length; a += 1) {
      for (let b = a + 1; b < boxes.length; b += 1) {
        const p = boxes[a]!;
        const q = boxes[b]!;
        const overlapX = Math.abs(p.center.x - q.center.x) < p.box.halfW + q.box.halfW;
        const overlapZ = Math.abs(p.center.z - q.center.z) < p.box.halfD + q.box.halfD;
        expect(overlapX && overlapZ, `${p.id} overlaps ${q.id}`).toBe(false);
      }
    }
  });
});
