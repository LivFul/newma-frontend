import * as THREE from "three";
import { NODE_3D_SHAPE, NODE_3D_WRAP_CHARS, node3dBox, wrapLabel } from "@/lib/workflow/footprints";
import type { Box } from "@/lib/workflow/geometry";
import type { WorkflowNode } from "@/lib/workflow/graph";
import { createLabelSprite, type LabelSprite } from "./labels";
import { cssHex, cssRgba, LANE_COLORS, SCENE_COLORS } from "./palette";

const BLOCK_HEIGHT = 0.7;
// Shared with the footprints the routes are planned against, so a tube always meets its mesh.
const {
  bevel: BEVEL,
  holdRadius: HOLD_RADIUS,
  startRadius: START_RADIUS,
  endRadius: END_RING_RADIUS,
} = NODE_3D_SHAPE;
const END_CORE_RADIUS = 0.28;
const LABEL_LIFT = 0.8;
/** Node labels are drawn larger than their blocks so they stay legible from the overview camera. */
const LABEL_SCALE = 1.4;
const PORT_BASE_HEIGHT = 0.3;
const PORT_HEIGHT_STEP = 0.1;
const BODY_MIX = 0.22;

export type NodeState = "idle" | "focus" | "near" | "dim";

const EMISSIVE: Readonly<Record<NodeState, number>> = {
  idle: 0.22,
  focus: 1,
  near: 0.55,
  dim: 0.05,
};
const OPACITY: Readonly<Record<NodeState, number>> = { idle: 1, focus: 1, near: 1, dim: 0.3 };

export interface NodeVisual {
  readonly def: WorkflowNode;
  /** Sits on the ground plane at the node's (x, z). */
  readonly root: THREE.Group;
  /** Child of `root`, lifted to the lane height in the separated view. */
  readonly group: THREE.Group;
  readonly material: THREE.MeshStandardMaterial;
  readonly outline: THREE.LineBasicMaterial;
  readonly label: LabelSprite;
  /** Footprint half-extents, the same ones the routes were planned against. */
  readonly box: Box;
  /** Height of the top face above the node's base. */
  readonly topY: number;
  readonly elevation: number;
  readonly stem: THREE.Mesh;
}

interface BodyShape {
  readonly geometry: THREE.BufferGeometry;
  readonly topY: number;
  /** Vertical offset of the mesh inside `group`: spheres are centred, blocks sit on their base. */
  readonly offsetY: number;
}

function roundedRect(width: number, depth: number, radius: number): THREE.Shape {
  const x = -width / 2;
  const y = -depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function blockShape(box: Box): BodyShape {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRect((box.halfW - BEVEL) * 2, (box.halfD - BEVEL) * 2, 0.18),
    {
      depth: BLOCK_HEIGHT,
      bevelEnabled: true,
      bevelSize: BEVEL,
      bevelThickness: BEVEL,
      bevelSegments: 2,
      curveSegments: 6,
    },
  );
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox as THREE.Box3;
  geometry.translate(0, -bounds.min.y, 0);
  return { geometry, topY: bounds.max.y - bounds.min.y, offsetY: 0 };
}

function holdShape(): BodyShape {
  const geometry = new THREE.CylinderGeometry(HOLD_RADIUS, HOLD_RADIUS, BLOCK_HEIGHT, 6);
  geometry.rotateY(Math.PI / 6);
  geometry.translate(0, BLOCK_HEIGHT / 2, 0);
  return { geometry, topY: BLOCK_HEIGHT, offsetY: 0 };
}

function sphereShape(radius: number): BodyShape {
  return { geometry: new THREE.SphereGeometry(radius, 32, 16), topY: radius * 2, offsetY: radius };
}

function shapeFor(def: WorkflowNode, box: Box): BodyShape {
  if (def.kind === "start") return sphereShape(START_RADIUS);
  if (def.kind === "end") return sphereShape(END_CORE_RADIUS);
  if (def.kind === "hold") return holdShape();
  return blockShape(box);
}

function glowFor(def: WorkflowNode): number {
  if (def.kind === "success") return SCENE_COLORS.success;
  if (def.kind === "failure") return SCENE_COLORS.danger;
  return LANE_COLORS[def.lane];
}

export function createNodeVisual(def: WorkflowNode, text: string, elevation: number): NodeVisual {
  const glow = glowFor(def);
  const box = node3dBox(def.kind, text);
  const shape = shapeFor(def, box);
  const terminal = def.kind === "start" || def.kind === "end";

  const root = new THREE.Group();
  root.position.set(def.x, 0, def.z);
  const group = new THREE.Group();
  root.add(group);

  const material = new THREE.MeshStandardMaterial({
    color: terminal
      ? SCENE_COLORS.text
      : new THREE.Color(SCENE_COLORS.ink).lerp(new THREE.Color(glow), BODY_MIX),
    emissive: new THREE.Color(glow),
    emissiveIntensity: EMISSIVE.idle,
    roughness: 0.45,
    metalness: 0.15,
  });
  const body = new THREE.Mesh(shape.geometry, material);
  body.position.y = shape.offsetY;
  body.userData.nodeId = def.id;
  group.add(body);

  const outline = new THREE.LineBasicMaterial({ color: glow, transparent: true, opacity: 0.9 });
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(shape.geometry, 25), outline));

  if (def.kind === "end") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(END_RING_RADIUS, 0.07, 12, 40), material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = shape.offsetY;
    ring.userData.nodeId = def.id;
    group.add(ring);
  }

  const lines = terminal ? [text] : wrapLabel(text, NODE_3D_WRAP_CHARS);
  const label = createLabelSprite(lines, {
    fontPx: terminal ? 20 : 24,
    color: cssHex(SCENE_COLORS.text),
    background: cssRgba(SCENE_COLORS.ink, 0.82),
    border: cssHex(glow),
    padding: 8,
    worldScale: LABEL_SCALE,
  });
  label.sprite.position.set(0, shape.topY + LABEL_LIFT, 0);
  group.add(label.sprite);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1, 8),
    new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.35 }),
  );
  root.add(stem);

  const footprint = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.36, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  footprint.position.y = 0.02;
  root.add(footprint);

  return {
    def,
    root,
    group,
    material,
    outline,
    label,
    box,
    topY: shape.topY,
    elevation,
    stem,
  };
}

/** Lifts a node to its lane height; `spread` runs from 0 (flat, as drawn) to 1 (lanes separated). */
export function layoutNode(visual: NodeVisual, spread: number): void {
  const height = visual.elevation * spread;
  visual.group.position.y = height;
  visual.stem.visible = height > 0.05;
  visual.stem.scale.y = Math.max(height, 0.001);
  visual.stem.position.y = height / 2;
}

export function applyNodeState(visual: NodeVisual, state: NodeState): void {
  visual.material.emissiveIntensity = EMISSIVE[state];
  visual.material.transparent = state === "dim";
  visual.material.opacity = OPACITY[state];
  visual.outline.opacity = state === "dim" ? 0.2 : 0.9;
  visual.label.sprite.material.opacity = state === "dim" ? 0.25 : 1;
}

/** Height above the node's base at which a connector meets it; `variant` staggers crossing tubes. */
export function portHeight(visual: NodeVisual, variant: number): number {
  if (visual.def.kind === "start") return START_RADIUS;
  if (visual.def.kind === "end") return END_CORE_RADIUS;
  return PORT_BASE_HEIGHT + variant * PORT_HEIGHT_STEP;
}

/** World-space centre of the node's top face. */
export function nodeTop(visual: NodeVisual): THREE.Vector3 {
  return new THREE.Vector3(visual.def.x, visual.group.position.y + visual.topY, visual.def.z);
}
