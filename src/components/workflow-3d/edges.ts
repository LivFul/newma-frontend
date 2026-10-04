import * as THREE from "three";
import { wrapLabel } from "@/lib/workflow/footprints";
import { filletSegments, planRoute, type Footprint, type Point } from "@/lib/workflow/geometry";
import type { WorkflowEdge } from "@/lib/workflow/graph";
import { createLabelSprite, type LabelSprite } from "./labels";
import { portHeight, type NodeVisual } from "./nodes";
import { cssHex, cssRgba, SCENE_COLORS, TONE_COLORS } from "./palette";

const TUBE_RADIUS = 0.06;
const TUBE_SEGMENTS_PER_UNIT = 8;
const MIN_TUBE_SEGMENTS = 32;
const MAX_TUBE_SEGMENTS = 600;
const ARROW_LENGTH = 0.42;
const ARROW_RADIUS = 0.17;
const CORNER_RADIUS = 0.6;
const HEIGHT_VARIANTS = 4;
const LABEL_WRAP_CHARS = 26;
const LABEL_LIFT = 0.5;
const EPSILON = 1e-6;
const UP = new THREE.Vector3(0, 1, 0);

export type EdgeState = "idle" | "linked" | "dim";

const OPACITY: Readonly<Record<EdgeState, number>> = { idle: 0.6, linked: 1, dim: 0.07 };

export interface EdgeVisual {
  readonly def: WorkflowEdge;
  readonly group: THREE.Group;
  readonly material: THREE.MeshBasicMaterial;
  readonly tube: THREE.Mesh;
  readonly arrow: THREE.Mesh;
  readonly label: LabelSprite | null;
  readonly color: THREE.Color;
  /** Picks one of a few port heights so crossing tubes do not merge into each other. */
  readonly variant: number;
  /** Rebuilt when the edges are laid out again; particles read it each frame. */
  path: THREE.Curve<THREE.Vector3>;
}

export function createEdgeVisual(
  def: WorkflowEdge,
  label: string | undefined,
  index: number,
): EdgeVisual {
  const color = new THREE.Color(TONE_COLORS[def.tone]);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: OPACITY.idle });

  const group = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), material);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(ARROW_RADIUS, ARROW_LENGTH, 16), material);
  group.add(tube, arrow);

  const sprite = label
    ? createLabelSprite(wrapLabel(label, LABEL_WRAP_CHARS), {
        fontPx: 20,
        color: cssHex(SCENE_COLORS.text),
        background: cssRgba(SCENE_COLORS.ink, 0.9),
        border: cssHex(TONE_COLORS[def.tone]),
        padding: 8,
        weight: 500,
        worldScale: 1.25,
      })
    : null;
  if (sprite) {
    sprite.sprite.visible = false;
    group.add(sprite.sprite);
  }

  const placeholder = new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(1, 0, 0));
  return {
    def,
    group,
    material,
    tube,
    arrow,
    label: sprite,
    color,
    variant: index % HEIGHT_VARIANTS,
    path: placeholder,
  };
}

const footprintOf = (node: NodeVisual): Footprint => ({
  center: { x: node.def.x, z: node.def.z },
  box: node.box,
});

/** Lifts the plan polyline into 3D, sliding linearly from the start height to the end height. */
export function liftRoute(plan: readonly Point[], startY: number, endY: number): THREE.Vector3[] {
  const along: number[] = [0];
  for (let i = 1; i < plan.length; i += 1) {
    along.push(
      along[i - 1]! + Math.hypot(plan[i]!.x - plan[i - 1]!.x, plan[i]!.z - plan[i - 1]!.z),
    );
  }
  const total = along[along.length - 1]!;
  return plan.map(
    (point, i) =>
      new THREE.Vector3(
        point.x,
        startY + (endY - startY) * (total > 0 ? along[i]! / total : 0),
        point.z,
      ),
  );
}

/** Stops the tube short of the last point so the arrowhead fills the gap. */
export function trimForArrow(points: readonly THREE.Vector3[]): {
  readonly body: THREE.Vector3[];
  readonly tip: THREE.Vector3;
  readonly heading: THREE.Vector3;
} {
  const tip = points[points.length - 1]!;
  const heading = tip.clone().sub(points[points.length - 2]!);
  const segment = heading.length();
  heading.normalize();
  const cut = Math.min(ARROW_LENGTH, segment * 0.6);
  return {
    body: [...points.slice(0, -1), tip.clone().addScaledVector(heading, -cut)],
    tip,
    heading,
  };
}

/**
 * Rounds the corners of a lifted polyline with the same fillet the static diagram uses: the plan
 * is filleted on the ground, then every point gets the height the polyline has at that distance
 * along it. Heights slide linearly along the route, so the arcs ramp exactly like the straight runs.
 */
export function filletedPath(
  points: readonly THREE.Vector3[],
  radius: number,
): THREE.CurvePath<THREE.Vector3> {
  const plan = points.map((point): Point => ({ x: point.x, z: point.z }));
  const segments = filletSegments(plan, radius);
  const startY = points[0]!.y;
  const endY = points[points.length - 1]!.y;
  const total = plan.reduce(
    (sum, point, i) =>
      i === 0 ? 0 : sum + Math.hypot(point.x - plan[i - 1]!.x, point.z - plan[i - 1]!.z),
    0,
  );

  // Segments are visited in order and each arc's legs run along the polyline to its corner, so the
  // distance walked from point to point is the distance along the original polyline.
  let along = 0;
  let previous = plan[0]!;
  const lift = (point: Point): THREE.Vector3 => {
    along += Math.hypot(point.x - previous.x, point.z - previous.z);
    previous = point;
    const y = startY + (endY - startY) * (total > EPSILON ? along / total : 0);
    return new THREE.Vector3(point.x, y, point.z);
  };

  const path = new THREE.CurvePath<THREE.Vector3>();
  for (const segment of segments) {
    if (segment.kind === "line") {
      path.add(new THREE.LineCurve3(lift(segment.from), lift(segment.to)));
    } else {
      path.add(
        new THREE.QuadraticBezierCurve3(
          lift(segment.from),
          lift(segment.control),
          lift(segment.to),
        ),
      );
    }
  }
  return path;
}

/**
 * Re-plans the route between the two nodes at their current heights: the path the particles ride,
 * the arrowhead and the label. The tube mesh is rebuilt separately by `rebuildTube`.
 */
export function layoutEdge(visual: EdgeVisual, from: NodeVisual, to: NodeVisual): void {
  const plan = planRoute(visual.def.route, footprintOf(from), footprintOf(to));
  const startY = from.group.position.y + portHeight(from, visual.variant);
  const endY = to.group.position.y + portHeight(to, visual.variant);
  const { body, tip, heading } = trimForArrow(liftRoute(plan, startY, endY));

  const path = filletedPath(body, CORNER_RADIUS);
  path.updateArcLengths();
  visual.path = path;

  visual.arrow.position.copy(tip).addScaledVector(heading, -ARROW_LENGTH / 2);
  visual.arrow.quaternion.setFromUnitVectors(UP, heading);

  if (visual.label) {
    visual.label.sprite.position.copy(path.getPointAt(0.5)).y += LABEL_LIFT;
  }
}

/** Replaces the tube mesh with one built along the current path; the old geometry is freed. */
export function rebuildTube(visual: EdgeVisual): void {
  const segments = Math.min(
    MAX_TUBE_SEGMENTS,
    Math.max(MIN_TUBE_SEGMENTS, Math.round(visual.path.getLength() * TUBE_SEGMENTS_PER_UNIT)),
  );
  visual.tube.geometry.dispose();
  visual.tube.geometry = new THREE.TubeGeometry(visual.path, segments, TUBE_RADIUS, 8, false);
}

export function applyEdgeState(visual: EdgeVisual, state: EdgeState): void {
  visual.material.opacity = OPACITY[state];
}
