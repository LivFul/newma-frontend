// Value: protects=hovering or selecting a step lights its transitions and dims the rest; fails_when=applyHighlight stops classifying edges and nodes or label visibility drifts; why_new=no unit test built the 3D model; seam=none
// Value: protects=render on demand: the model reports when it stops moving so the stage can idle; fails_when=update() returns true while settled (endless redraws) or false while easing/flowing (frozen frames); why_new=update() now drives whether frames keep coming; seam=none
// Value: protects=lane easing rebuilds tube meshes at most every ~100 ms and always on the settled value, while nodes follow every frame; fails_when=tubes rebuild every frame or the final rebuild is skipped; why_new=the rebuild throttle changed from spread steps to time; seam=none
// Value: protects=reduced motion has no particles and jumps the lanes at once; fails_when=particles or easing appear under reduced motion; why_new=no unit test built the 3D model; seam=none
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { WORKFLOW_EDGES, WORKFLOW_LANES, WORKFLOW_NODES } from "@/lib/workflow/graph";

// jsdom has no 2D canvas, so the text sprites are stood in for by plain sprites.
vi.mock("@/components/workflow-3d/labels", () => ({
  createLabelSprite: () => ({ sprite: new THREE.Sprite(new THREE.SpriteMaterial()) }),
}));

const { createWorkflowModel } = await import("@/components/workflow-3d/model");

const COPY = {
  nodeLabels: Object.fromEntries(WORKFLOW_NODES.map((node) => [node.id, node.id])),
  edgeLabels: Object.fromEntries(WORKFLOW_EDGES.map((edge) => [edge.id, edge.id])),
  noteText: {},
};
const FRAME = 1 / 60;

function tubes(group: THREE.Group): THREE.Mesh[] {
  const found: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.TubeGeometry) {
      found.push(object);
    }
  });
  return found;
}

function bodyOf(model: ReturnType<typeof createWorkflowModel>, id: string): THREE.Mesh {
  const body = model.pickables.find((object) => object.userData.nodeId === id);
  if (!(body instanceof THREE.Mesh)) throw new Error(`no pickable for ${id}`);
  return body;
}

const emissive = (mesh: THREE.Mesh) =>
  (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity;

describe("createWorkflowModel", () => {
  it("builds a pickable body for every node and a tube for every edge", () => {
    const model = createWorkflowModel(COPY, { reducedMotion: true });

    const ids = new Set(model.pickables.map((object) => object.userData.nodeId as string));
    expect([...ids].sort()).toEqual(WORKFLOW_NODES.map((node) => node.id).sort());
    expect(tubes(model.group)).toHaveLength(WORKFLOW_EDGES.length);
    model.dispose();
  });

  it("lights the active step and its neighbours and dims everything else", () => {
    const model = createWorkflowModel(COPY, { reducedMotion: true });
    const linked = WORKFLOW_EDGES.find((edge) => edge.from === "start")!;
    const idleStart = emissive(bodyOf(model, "start"));

    model.setActive(null, "start");

    expect(emissive(bodyOf(model, "start"))).toBe(1);
    expect(emissive(bodyOf(model, linked.to))).toBeGreaterThan(idleStart);
    expect(emissive(bodyOf(model, "end"))).toBeLessThan(idleStart);
    const edgeMaterials = tubes(model.group).map(
      (tube) => (tube.material as THREE.MeshBasicMaterial).opacity,
    );
    expect(edgeMaterials).toContain(1);
    expect(Math.min(...edgeMaterials)).toBeLessThan(0.1);
    const visibleLabels = model.group.children.filter(
      (child) =>
        child instanceof THREE.Group &&
        child.children.some((c) => c instanceof THREE.Sprite && c.visible),
    );
    expect(visibleLabels.length).toBeGreaterThan(0);

    // Hover wins over selection; clearing both returns every step to idle.
    model.setActive("end", "start");
    expect(emissive(bodyOf(model, "end"))).toBe(1);
    model.setActive(null, null);
    expect(emissive(bodyOf(model, "start"))).toBe(idleStart);
    expect(emissive(bodyOf(model, "end"))).toBe(idleStart);
    model.dispose();
  });

  it("keeps animating while particles flow", () => {
    const model = createWorkflowModel(COPY, { reducedMotion: false });

    expect(model.update(1)).toBe(true);
    expect(model.update(1 + FRAME)).toBe(true);
    model.dispose();
  });

  it("reports idle under reduced motion and jumps the lanes at once", () => {
    const model = createWorkflowModel(COPY, { reducedMotion: true });
    const topLane = WORKFLOW_LANES[0]!;
    const lifted = WORKFLOW_NODES.find((node) => node.lane === topLane.id)!;
    const body = bodyOf(model, lifted.id);
    const rebuilt = tubes(model.group).map((tube) => tube.geometry);

    expect(model.update(1)).toBe(false);
    model.setSpread(1);

    expect(body.parent!.position.y).toBe(topLane.elevation);
    expect(model.update(1 + FRAME)).toBe(false);
    tubes(model.group).forEach((tube, i) => expect(tube.geometry).not.toBe(rebuilt[i]));
    model.dispose();
  });

  it("eases the lanes, rebuilding tubes at most every 100 ms and once more when settled", () => {
    const moving = createWorkflowModel(COPY, { reducedMotion: false });
    const topLane = WORKFLOW_LANES[0]!;
    const lifted = WORKFLOW_NODES.find((node) => node.lane === topLane.id)!;
    const group = bodyOf(moving, lifted.id).parent!;
    const edgeIndex = WORKFLOW_EDGES.findIndex(
      (edge) => WORKFLOW_NODES.find((node) => node.id === edge.from)!.lane === topLane.id,
    );
    const tube = tubes(moving.group)[edgeIndex]!;

    moving.update(10);
    moving.setSpread(1);
    const heights: number[] = [];
    const geometries = new Set<THREE.BufferGeometry>([tube.geometry]);
    let t = 10;
    for (let frame = 0; frame < 240 && group.position.y !== topLane.elevation; frame += 1) {
      t += FRAME;
      moving.update(t);
      heights.push(group.position.y);
      geometries.add(tube.geometry);
    }
    const elapsed = t - 10;

    expect(group.position.y).toBe(topLane.elevation);
    // Nodes move on every frame while the tubes are rebuilt far less often.
    expect(new Set(heights).size).toBeGreaterThan(elapsed / FRAME - 2);
    const rebuilds = geometries.size - 1;
    expect(rebuilds).toBeGreaterThan(1);
    expect(rebuilds).toBeLessThanOrEqual(Math.ceil(elapsed / 0.1) + 1);
    // The settled tube follows the lifted node, not a stale intermediate height.
    const tubeStart = (tube.geometry as THREE.TubeGeometry).parameters.path.getPointAt(0);
    expect(tubeStart.y).toBeGreaterThan(topLane.elevation);
    moving.dispose();
  });

  it("frees geometries and materials on dispose", () => {
    const model = createWorkflowModel(COPY, { reducedMotion: false });
    const geometry = tubes(model.group)[0]!.geometry;
    const dispose = vi.spyOn(geometry, "dispose");

    model.dispose();

    expect(dispose).toHaveBeenCalled();
  });
});
