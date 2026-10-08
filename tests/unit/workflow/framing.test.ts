import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  FRAME_FILL,
  FRAMING_IGNORE,
  contentBounds,
  fitDistance,
} from "@/components/workflow-3d/framing";

const FOV = 42;
const TARGET = new THREE.Vector3(0, 0, 0);
const DOWN_AND_BACK = new THREE.Vector3(0, 0.927, 0.375).normalize();
// A wide, flat diagram footprint like the workflow model's.
const BOX = new THREE.Box3(new THREE.Vector3(-30, -1, -26), new THREE.Vector3(30, 3, 26));

function largestExtent(distance: number, aspect: number): number {
  const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 5000);
  camera.position.copy(TARGET).addScaledVector(DOWN_AND_BACK, distance);
  camera.lookAt(TARGET);
  camera.updateMatrixWorld(true);
  let extent = 0;
  for (let i = 0; i < 8; i += 1) {
    const corner = new THREE.Vector3(
      i & 1 ? BOX.max.x : BOX.min.x,
      i & 2 ? BOX.max.y : BOX.min.y,
      i & 4 ? BOX.max.z : BOX.min.z,
    ).project(camera);
    extent = Math.max(extent, Math.abs(corner.x), Math.abs(corner.y));
  }
  return extent;
}

describe("fitDistance", () => {
  // Value: protects=the 3D workflow opens with every step in frame whatever the canvas shape; fails_when=the fit lets a corner project outside the frame or backs off far past the snug distance; why_new=a hand-tuned distance clipped the model's left and right edges; seam=none
  it("frames the whole box snugly, inside the frame fill", () => {
    for (const aspect of [0.6, 1, 1.0964, 1.8]) {
      const distance = fitDistance(FOV, aspect, BOX, TARGET, DOWN_AND_BACK);
      expect(largestExtent(distance, aspect), `aspect ${aspect}`).toBeLessThanOrEqual(FRAME_FILL);
      expect(largestExtent(distance, aspect), `aspect ${aspect}`).toBeGreaterThan(
        FRAME_FILL - 0.02,
      );
    }
  });

  // Value: protects=framing degrades safely at the extremes: a model that can never fit returns the maximum distance instead of looping or throwing, and a tiny one is framed close rather than from far away; fails_when=the never-fits guard is removed (the search would converge on an out-of-frame distance) or the lower bound is lost; why_new=the main case only uses one moderate box; seam=none
  it("caps an impossible fit at the maximum distance and frames a tiny box close", () => {
    const huge = new THREE.Box3(new THREE.Vector3(-1e5, -1, -1e5), new THREE.Vector3(1e5, 1, 1e5));
    expect(fitDistance(FOV, 1, huge, TARGET, DOWN_AND_BACK)).toBe(1000);
    const tiny = new THREE.Box3(
      new THREE.Vector3(-0.01, 0, -0.01),
      new THREE.Vector3(0.01, 0.01, 0.01),
    );
    const near = fitDistance(FOV, 1, tiny, TARGET, DOWN_AND_BACK);
    expect(near).toBeGreaterThanOrEqual(1);
    expect(near).toBeLessThan(1.01);
  });

  it("backs off further for a narrower canvas", () => {
    const wide = fitDistance(FOV, 1.8, BOX, TARGET, DOWN_AND_BACK);
    const narrow = fitDistance(FOV, 0.6, BOX, TARGET, DOWN_AND_BACK);
    expect(narrow).toBeGreaterThan(wide);
  });
});

describe("contentBounds", () => {
  // Value: protects=framing fits the diagram, not the far larger ground grid; fails_when=the ignore flag stops excluding the grid; why_new=the model group mixes the floor with the diagram; seam=none
  it("measures children except the ones flagged to ignore", () => {
    const root = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(500, 1, 500));
    floor.userData[FRAMING_IGNORE] = true;
    const node = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 6));
    node.position.set(10, 0, -5);
    root.add(floor, node);
    const box = contentBounds(root)!;
    expect(box.min.x).toBeCloseTo(8);
    expect(box.max.x).toBeCloseTo(12);
    expect(box.max.z).toBeCloseTo(-2);
  });

  it("returns null when there is nothing to frame", () => {
    const root = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5));
    floor.userData[FRAMING_IGNORE] = true;
    root.add(floor);
    expect(contentBounds(root)).toBeNull();
  });
});
