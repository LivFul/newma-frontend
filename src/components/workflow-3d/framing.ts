import * as THREE from "three";

/** Share of the view, edge to edge, the model may fill; the rest is breathing room at the frame edge. */
export const FRAME_FILL = 0.96;
const SEARCH_STEPS = 32;
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 1000;

/** Marks an object (the ground grid) that framing ignores, so only the diagram itself is fitted. */
export const FRAMING_IGNORE = "framingIgnore";

/** The box around everything in `root` that the camera should frame, or null when there is nothing. */
export function contentBounds(root: THREE.Object3D): THREE.Box3 | null {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const child of root.children) {
    if (!child.userData[FRAMING_IGNORE]) box.expandByObject(child);
  }
  return box.isEmpty() ? null : box;
}

function corners(box: THREE.Box3): THREE.Vector3[] {
  const { min, max } = box;
  return [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) => new THREE.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z),
  );
}

function fits(camera: THREE.PerspectiveCamera, points: THREE.Vector3[]): boolean {
  return points.every((point) => {
    const ndc = point.clone().project(camera);
    // Points behind the camera project to z > 1; they are never in frame.
    return ndc.z < 1 && Math.abs(ndc.x) <= FRAME_FILL && Math.abs(ndc.y) <= FRAME_FILL;
  });
}

/**
 * The shortest distance along `direction` from `target` at which a camera with this vertical field of
 * view and aspect sees every corner of `box` inside the frame. Binary search: once the box fits at some
 * distance it fits at every greater one, because moving straight back only shrinks its projection.
 */
export function fitDistance(
  fovDegrees: number,
  aspect: number,
  box: THREE.Box3,
  target: THREE.Vector3,
  direction: THREE.Vector3,
): number {
  const camera = new THREE.PerspectiveCamera(fovDegrees, aspect, 0.1, MAX_DISTANCE * 2);
  const unit = direction.clone().normalize();
  const points = corners(box);
  const fitsAt = (distance: number) => {
    camera.position.copy(target).addScaledVector(unit, distance);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    return fits(camera, points);
  };
  let near = MIN_DISTANCE;
  let far = MAX_DISTANCE;
  if (!fitsAt(far)) return far;
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const mid = (near + far) / 2;
    if (fitsAt(mid)) far = mid;
    else near = mid;
  }
  return far;
}
