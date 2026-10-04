import * as THREE from "three";
import { note3dBox, wrapLabel } from "@/lib/workflow/footprints";
import type { WorkflowNote } from "@/lib/workflow/graph";
import { createLabelSprite, type LabelSprite } from "./labels";
import { nodeTop, type NodeVisual } from "./nodes";
import { cssHex, SCENE_COLORS } from "./palette";

const PLATE_HEIGHT = 0.1;
const LABEL_WRAP_CHARS = 24;
const LABEL_LIFT = 0.9;
const LABEL_SCALE = 1.2;

export interface NoteVisual {
  readonly def: WorkflowNote;
  /** Parent of the panel and the leader line; it stays at the origin so line points are world-space. */
  readonly root: THREE.Group;
  readonly panel: THREE.Group;
  readonly line: THREE.Line;
  readonly label: LabelSprite;
}

export function createNoteVisual(def: WorkflowNote, text: string): NoteVisual {
  const box = note3dBox();
  const root = new THREE.Group();
  const panel = new THREE.Group();
  root.add(panel);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(box.halfW * 2, PLATE_HEIGHT, box.halfD * 2),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(SCENE_COLORS.ink).lerp(new THREE.Color(SCENE_COLORS.success), 0.12),
      emissive: new THREE.Color(SCENE_COLORS.success),
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.85,
    }),
  );
  plate.position.y = PLATE_HEIGHT / 2;
  panel.add(plate);

  const label = createLabelSprite(wrapLabel(text, LABEL_WRAP_CHARS), {
    fontPx: 21,
    color: cssHex(SCENE_COLORS.textMuted),
    background: "rgba(11, 16, 32, 0.86)",
    border: cssHex(SCENE_COLORS.success),
    padding: 10,
    weight: 500,
    worldScale: LABEL_SCALE,
  });
  label.sprite.position.y = PLATE_HEIGHT + LABEL_LIFT;
  panel.add(label.sprite);
  panel.position.set(def.x, 0, def.z);

  // Two fixed buffers, written in place on every layout pass: replacing attributes each time would
  // leave the old GPU buffers allocated until the context dies.
  const leader = new THREE.BufferGeometry();
  leader.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  leader.setAttribute("lineDistance", new THREE.BufferAttribute(new Float32Array(2), 1));
  const line = new THREE.Line(
    leader,
    new THREE.LineDashedMaterial({
      color: SCENE_COLORS.success,
      dashSize: 0.25,
      gapSize: 0.18,
      transparent: true,
      opacity: 0.8,
    }),
  );
  // The fixed buffers start empty, so the bounding sphere cannot be trusted for culling.
  line.frustumCulled = false;
  root.add(line);

  return { def, root, panel, line, label };
}

/** Lifts the note to its anchor node's current height and redraws the leader line. */
export function layoutNote(visual: NoteVisual, anchor: NodeVisual): void {
  visual.panel.position.y = anchor.group.position.y;
  const target = nodeTop(anchor);
  const start = visual.panel.position;
  const startY = start.y + PLATE_HEIGHT;

  const position = visual.line.geometry.getAttribute("position") as THREE.BufferAttribute;
  position.setXYZ(0, start.x, startY, start.z);
  position.setXYZ(1, target.x, target.y, target.z);
  position.needsUpdate = true;

  const distance = visual.line.geometry.getAttribute("lineDistance") as THREE.BufferAttribute;
  distance.setX(0, 0);
  distance.setX(1, Math.hypot(target.x - start.x, target.y - startY, target.z - start.z));
  distance.needsUpdate = true;
}
