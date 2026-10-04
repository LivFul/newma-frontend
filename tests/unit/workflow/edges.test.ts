// Value: protects=3D routes ramp linearly between port heights and the polyline keeps its length; fails_when=liftRoute stops interpolating by distance or ignores a zero-length plan; why_new=no test covered the 3D route maths; seam=none
// Value: protects=the arrowhead fills the gap the tube leaves at the entry port; fails_when=trimForArrow cuts the wrong amount or moves the tip; why_new=no test covered the 3D route maths; seam=none
// Value: protects=the 3D tubes use the shared fillet (same corner radius, same half-run cap) and keep their heights; fails_when=filletedPath drifts from filletSegments or lifts arcs to the wrong height; why_new=the fillet was duplicated before this change; seam=none
// Value: protects=layoutEdge re-plans path, arrow and label without touching the tube, and rebuildTube frees the old mesh; fails_when=the split leaks geometry or leaves the arrow off the route; why_new=tube rebuilds are now throttled separately from the path; seam=none
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { filletSegments, type Point } from "@/lib/workflow/geometry";
import type { WorkflowEdge } from "@/lib/workflow/graph";
import { WORKFLOW_NODES } from "@/lib/workflow/graph";

// jsdom has no 2D canvas, so the text sprites are stood in for by plain sprites.
vi.mock("@/components/workflow-3d/labels", () => ({
  createLabelSprite: () => ({ sprite: new THREE.Sprite(new THREE.SpriteMaterial()) }),
}));

const {
  applyEdgeState,
  createEdgeVisual,
  filletedPath,
  layoutEdge,
  liftRoute,
  rebuildTube,
  trimForArrow,
} = await import("@/components/workflow-3d/edges");
const { createNodeVisual } = await import("@/components/workflow-3d/nodes");

const CLOSE = 6;

function nodeDef(id: string) {
  const def = WORKFLOW_NODES.find((node) => node.id === id);
  if (!def) throw new Error(`missing node ${id}`);
  return def;
}

describe("liftRoute", () => {
  it("slides the height linearly by distance travelled along the plan", () => {
    const plan: Point[] = [
      { x: 0, z: 0 },
      { x: 3, z: 0 },
      { x: 3, z: 1 },
    ];

    const lifted = liftRoute(plan, 0, 4);

    expect(lifted.map((p) => p.y)).toEqual([0, 3, 4]);
    expect(lifted.map((p) => [p.x, p.z])).toEqual([
      [0, 0],
      [3, 0],
      [3, 1],
    ]);
  });

  it("keeps a zero-length plan at the start height", () => {
    const lifted = liftRoute(
      [
        { x: 1, z: 1 },
        { x: 1, z: 1 },
      ],
      2,
      5,
    );

    expect(lifted.map((p) => p.y)).toEqual([2, 2]);
  });
});

describe("trimForArrow", () => {
  it("stops the body short of the tip by the arrow length on a long final run", () => {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0)];

    const { body, tip, heading } = trimForArrow(points);

    expect(tip).toBe(points[1]);
    expect(heading.toArray()).toEqual([1, 0, 0]);
    expect(body[body.length - 1]!.x).toBeCloseTo(10 - 0.42, CLOSE);
  });

  it("never cuts more than 60% of a short final run", () => {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.5)];

    const { body } = trimForArrow(points);

    expect(body[1]!.z).toBeCloseTo(0.5 - 0.3, CLOSE);
    expect(points[1]!.z).toBe(0.5);
  });
});

describe("filletedPath", () => {
  it("rounds each corner with the shared 2D fillet and keeps the polyline heights", () => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4, 2, 0),
      new THREE.Vector3(4, 4, 4),
    ];
    const plan = points.map((p) => ({ x: p.x, z: p.z }));

    const path = filletedPath(points, 0.6);
    const expected = filletSegments(plan, 0.6);

    expect(path.curves.map((curve) => curve.type)).toEqual([
      "LineCurve3",
      "QuadraticBezierCurve3",
      "LineCurve3",
    ]);
    expect(path.curves).toHaveLength(expected.length);

    const corner = path.curves[1] as THREE.QuadraticBezierCurve3;
    // The arc starts 0.6 before the corner (4 of 8 units along) and ends 0.6 after it.
    expect(corner.v0.x).toBeCloseTo(3.4, CLOSE);
    expect(corner.v0.z).toBe(0);
    expect(corner.v0.y).toBeCloseTo((3.4 / 8) * 4, CLOSE);
    expect(corner.v1.toArray()).toEqual([4, 2, 0]);
    expect(corner.v2.x).toBe(4);
    expect(corner.v2.z).toBeCloseTo(0.6, CLOSE);
    expect(corner.v2.y).toBeCloseTo((4.6 / 8) * 4, CLOSE);

    expect(path.getPointAt(0).toArray()).toEqual([0, 0, 0]);
    const end = path.getPointAt(1);
    expect(end.x).toBeCloseTo(4, CLOSE);
    expect(end.y).toBeCloseTo(4, CLOSE);
    expect(end.z).toBeCloseTo(4, CLOSE);
  });

  it("caps the corner reach at half of a short neighbouring run", () => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 0, 0),
      new THREE.Vector3(0.4, 0, 5),
    ];

    const path = filletedPath(points, 0.6);

    // The first run is shorter than twice the radius, so the arc starts at its midpoint.
    const arc = path.curves[1] as THREE.QuadraticBezierCurve3;
    expect(arc.type).toBe("QuadraticBezierCurve3");
    expect(arc.v0.x).toBeCloseTo(0.2, CLOSE);
    expect(arc.v2.z).toBeCloseTo(0.2, CLOSE);
  });

  it("keeps a straight run straight and level when the ends share a height", () => {
    const path = filletedPath([new THREE.Vector3(0, 1, 0), new THREE.Vector3(5, 1, 0)], 0.6);

    expect(path.curves).toHaveLength(1);
    expect(path.getPointAt(0.5).toArray()).toEqual([2.5, 1, 0]);
  });
});

describe("edge visuals", () => {
  const def: WorkflowEdge = {
    id: "test-edge",
    from: "start",
    to: "rights",
    tone: "pass",
    route: { exit: ["S", 0], via: [], enter: ["N", 0] },
  };
  const from = createNodeVisual(nodeDef("start"), "Start", 0);
  const to = createNodeVisual(nodeDef("rights"), "Rights", 0);

  it("lays the path, arrow and label along the route without rebuilding the tube", () => {
    const visual = createEdgeVisual(def, "label", 1);
    const tubeBefore = visual.tube.geometry;

    layoutEdge(visual, from, to);

    expect(visual.tube.geometry).toBe(tubeBefore);
    const start = visual.path.getPointAt(0);
    expect(start.x).toBeCloseTo(nodeDef("start").x, CLOSE);
    expect(start.z).toBeGreaterThan(nodeDef("start").z);
    // The arrow sits between the trimmed tube end and the entry port, pointing down the page.
    expect(visual.arrow.position.z).toBeLessThan(nodeDef("rights").z - to.box.halfD);
    expect(new THREE.Vector3(0, 1, 0).applyQuaternion(visual.arrow.quaternion).z).toBeCloseTo(
      1,
      CLOSE,
    );
    expect(visual.label!.sprite.position.y).toBeGreaterThan(visual.path.getPointAt(0.5).y);
  });

  it("rebuilds the tube along the current path and frees the old geometry", () => {
    const visual = createEdgeVisual(def, undefined, 0);
    layoutEdge(visual, from, to);
    const old = visual.tube.geometry;
    const dispose = vi.spyOn(old, "dispose");

    rebuildTube(visual);

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(visual.tube.geometry).toBeInstanceOf(THREE.TubeGeometry);
    expect((visual.tube.geometry as THREE.TubeGeometry).parameters.path).toBe(visual.path);
    expect(visual.label).toBeNull();
  });

  it("fades the shared material by state", () => {
    const visual = createEdgeVisual(def, undefined, 0);

    applyEdgeState(visual, "dim");
    expect(visual.material.opacity).toBeLessThan(0.1);
    applyEdgeState(visual, "linked");
    expect(visual.material.opacity).toBe(1);
  });
});
