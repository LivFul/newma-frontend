import * as THREE from "three";
import {
  WORKFLOW_EDGES,
  WORKFLOW_LANES,
  WORKFLOW_NODES,
  WORKFLOW_NOTES,
} from "@/lib/workflow/graph";
import {
  applyEdgeState,
  createEdgeVisual,
  layoutEdge,
  type EdgeState,
  type EdgeVisual,
} from "./edges";
import {
  applyNodeState,
  createNodeVisual,
  layoutNode,
  type NodeState,
  type NodeVisual,
} from "./nodes";
import { createNoteVisual, layoutNote, type NoteVisual } from "./notes";
import { SCENE_COLORS } from "./palette";

const PARTICLES_PER_EDGE = 3;
const PARTICLE_RADIUS = 0.075;
/** Particle travel speed in world units per second, so long and short routes flow at one pace. */
const FLOW_SPEED = 2.4;
const FLOW_PHASE_STEP = 0.137;
const GRID_SIZE = 90;
/** How quickly the lane height eases towards its target, per second. */
const SPREAD_RATE = 6;
const SPREAD_SNAP = 0.002;
/** Share of the lane-height move after which the tubes are rebuilt while it is still easing. */
const EDGE_REBUILD_STEP = 0.05;
const MAX_STEP_SECONDS = 0.1;

export interface SceneCopy {
  readonly nodeLabels: Readonly<Record<string, string>>;
  readonly edgeLabels: Readonly<Record<string, string>>;
  readonly noteText: Readonly<Record<string, string>>;
}

export interface ModelOptions {
  /** No flowing particles, and lane height changes jump instead of easing. */
  readonly reducedMotion: boolean;
}

export interface WorkflowModel {
  readonly group: THREE.Group;
  /** Meshes that respond to hover and click; each carries `userData.nodeId`. */
  readonly pickables: readonly THREE.Object3D[];
  /** 0 keeps every lane on the ground as drawn; 1 lifts each lane to its own height. */
  setSpread(target: number): void;
  setActive(hovered: string | null, selected: string | null): void;
  update(timeSeconds: number): void;
  dispose(): void;
}

function createGrid(): THREE.GridHelper {
  const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, SCENE_COLORS.border, SCENE_COLORS.ink);
  grid.position.y = -0.01;
  const material = grid.material as THREE.Material;
  material.transparent = true;
  material.opacity = 0.6;
  return grid;
}

function createParticles(edges: readonly EdgeVisual[]): THREE.InstancedMesh {
  const particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(PARTICLE_RADIUS, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    edges.length * PARTICLES_PER_EDGE,
  );
  edges.forEach((edge, edgeIndex) => {
    for (let p = 0; p < PARTICLES_PER_EDGE; p += 1) {
      particles.setColorAt(edgeIndex * PARTICLES_PER_EDGE + p, edge.color);
    }
  });
  // Instances travel along curves far from the origin-based bounding sphere.
  particles.frustumCulled = false;
  return particles;
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh;
    renderable.geometry?.dispose();
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : [renderable.material];
    for (const material of materials) {
      if (!material) continue;
      (material as THREE.SpriteMaterial).map?.dispose();
      material.dispose();
    }
  });
}

export function createWorkflowModel(copy: SceneCopy, options: ModelOptions): WorkflowModel {
  const group = new THREE.Group();
  group.add(createGrid());

  const elevations = new Map(WORKFLOW_LANES.map((lane) => [lane.id, lane.elevation]));
  const nodes = new Map<string, NodeVisual>();
  for (const def of WORKFLOW_NODES) {
    const visual = createNodeVisual(
      def,
      copy.nodeLabels[def.id] ?? "",
      elevations.get(def.lane) ?? 0,
    );
    nodes.set(def.id, visual);
    group.add(visual.root);
  }

  const edges: EdgeVisual[] = WORKFLOW_EDGES.map((def, index) => {
    const visual = createEdgeVisual(def, copy.edgeLabels[def.id], index);
    group.add(visual.group);
    return visual;
  });
  const notes: NoteVisual[] = WORKFLOW_NOTES.map((def) => {
    const visual = createNoteVisual(def, copy.noteText[def.id] ?? "");
    group.add(visual.root);
    return visual;
  });

  const particles = options.reducedMotion ? null : createParticles(edges);
  if (particles) group.add(particles);

  const pickables: THREE.Object3D[] = [];
  group.traverse((object) => {
    if (object.userData.nodeId) pickables.push(object);
  });

  const nodeOf = (id: string): NodeVisual => {
    const found = nodes.get(id);
    if (!found) throw new Error(`Workflow scene references unknown node "${id}"`);
    return found;
  };

  const edgeStates: EdgeState[] = edges.map(() => "idle");
  const dummy = new THREE.Object3D();
  let spread = 0;
  let spreadTarget = 0;
  let hovered: string | null = null;
  let selected: string | null = null;
  let lastTime: number | null = null;

  function applyHighlight(): void {
    const active = hovered ?? selected;
    const neighbours = new Set<string>();

    edges.forEach((edge, index) => {
      const linked = active !== null && (edge.def.from === active || edge.def.to === active);
      if (linked) {
        neighbours.add(edge.def.from);
        neighbours.add(edge.def.to);
      }
      const state: EdgeState = active === null ? "idle" : linked ? "linked" : "dim";
      edgeStates[index] = state;
      applyEdgeState(edge, state);
      // A transition's label shows only while one of its steps is being looked at.
      if (edge.label) edge.label.sprite.visible = linked;
    });

    nodes.forEach((visual, id) => {
      const state: NodeState =
        active === null ? "idle" : id === active ? "focus" : neighbours.has(id) ? "near" : "dim";
      applyNodeState(visual, state);
    });
  }

  // Rebuilding every tube is the expensive part of a layout pass, so while the lanes ease the tubes
  // are rebuilt only every few percent of the move (and always once it settles). Nodes and notes,
  // which are cheap, follow every frame.
  let edgeSpread = 0;
  function refreshLayout(): void {
    nodes.forEach((visual) => layoutNode(visual, spread));
    notes.forEach((note) => layoutNote(note, nodeOf(note.def.attachTo)));
    if (spread === spreadTarget || Math.abs(spread - edgeSpread) >= EDGE_REBUILD_STEP) {
      edges.forEach((edge) => layoutEdge(edge, nodeOf(edge.def.from), nodeOf(edge.def.to)));
      edgeSpread = spread;
    }
    applyHighlight();
  }

  refreshLayout();

  function stepSpread(seconds: number): void {
    if (spread === spreadTarget) return;
    const gap = spreadTarget - spread;
    spread =
      Math.abs(gap) < SPREAD_SNAP
        ? spreadTarget
        : spread + gap * Math.min(1, seconds * SPREAD_RATE);
    refreshLayout();
  }

  function stepParticles(timeSeconds: number): void {
    if (!particles) return;
    edges.forEach((edge, edgeIndex) => {
      const speed = FLOW_SPEED / edge.path.getLength();
      const scale = edgeStates[edgeIndex] === "dim" ? 0 : 1;
      for (let p = 0; p < PARTICLES_PER_EDGE; p += 1) {
        const progress =
          (timeSeconds * speed + p / PARTICLES_PER_EDGE + edgeIndex * FLOW_PHASE_STEP) % 1;
        // Written straight into the scratch object, so no vector is allocated per particle per frame.
        edge.path.getPointAt(progress, dummy.position);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        particles.setMatrixAt(edgeIndex * PARTICLES_PER_EDGE + p, dummy.matrix);
      }
    });
    particles.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    pickables,
    setSpread(target) {
      spreadTarget = Math.min(1, Math.max(0, target));
      if (options.reducedMotion) {
        spread = spreadTarget;
        refreshLayout();
      }
    },
    setActive(nextHovered, nextSelected) {
      hovered = nextHovered;
      selected = nextSelected;
      applyHighlight();
    },
    update(timeSeconds) {
      const seconds = lastTime === null ? 0 : Math.min(timeSeconds - lastTime, MAX_STEP_SECONDS);
      lastTime = timeSeconds;
      stepSpread(seconds);
      stepParticles(timeSeconds);
    },
    dispose() {
      // The instanced mesh owns matrix and colour buffers that a plain traversal does not free.
      particles?.dispose();
      disposeObject(group);
    },
  };
}
