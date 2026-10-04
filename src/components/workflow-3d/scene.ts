import * as THREE from "three";
import { createWorkflowModel, type SceneCopy } from "./model";
import { createStage, type CameraPose, type NavCommand, type Stage } from "./stage";

/** Distance at which the model's width (about 54 units with margin) fills a view of aspect 1. */
const HORIZONTAL_FIT = 64;
/** Minimum distance so the model's depth always fits vertically. */
const VERTICAL_FIT = 44;
/** Extra distance for the view that also spans the lane heights. */
const RAISED_SCALE = 1.15;
const CLICK_DRAG_TOLERANCE_PX = 5;

const FLAT_TARGET = new THREE.Vector3(-0.6, 0, 0.3);
const FLAT_DIRECTION = new THREE.Vector3(0, 0.927, 0.375).normalize();
const RAISED_TARGET = new THREE.Vector3(-0.6, 3, 0);
const RAISED_DIRECTION = new THREE.Vector3(-0.128, 0.384, 0.914).normalize();

export interface SceneOptions {
  readonly copy: SceneCopy;
  readonly reducedMotion: boolean;
}

export interface SceneController {
  setNavigation(command: NavCommand | null): void;
  /** Glides back to the opening view for the current lane arrangement. */
  resetView(): void;
  /** Lifts each lane to its own height (true) or flattens them onto the ground (false). */
  setSeparated(separated: boolean): void;
  dispose(): void;
}

function poseFor(separated: boolean, aspect: number): CameraPose {
  const target = separated ? RAISED_TARGET : FLAT_TARGET;
  const direction = separated ? RAISED_DIRECTION : FLAT_DIRECTION;
  const fit = Math.max(VERTICAL_FIT, HORIZONTAL_FIT / aspect) * (separated ? RAISED_SCALE : 1);
  return {
    target: target.clone(),
    position: target.clone().addScaledVector(direction, fit),
  };
}

/** Builds the scene inside `container` and returns the handle the React wrapper drives. */
export function createWorkflowScene(
  container: HTMLElement,
  options: SceneOptions,
): SceneController {
  const stage = createStage(container, { reducedMotion: options.reducedMotion });
  // If building the model fails, the stage is already running (canvas, render loop, observers), so
  // it must be released before the failure reaches the caller.
  try {
    return assembleScene(stage, options);
  } catch (error) {
    stage.dispose();
    throw error;
  }
}

function assembleScene(stage: Stage, options: SceneOptions): SceneController {
  const model = createWorkflowModel(options.copy, { reducedMotion: options.reducedMotion });
  stage.scene.add(model.group);
  stage.onFrame((timeSeconds) => model.update(timeSeconds));

  let separated = false;
  let hovered: string | null = null;
  let selected: string | null = null;
  const sync = () => model.setActive(hovered, selected);
  stage.setPose(poseFor(false, stage.aspect()));

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pressedAt: { readonly x: number; readonly y: number } | null = null;

  const pickNodeId = (event: PointerEvent): string | null => {
    const rect = stage.canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, stage.camera);
    const hit = raycaster.intersectObjects([...model.pickables], false)[0];
    return hit ? (hit.object.userData.nodeId as string) : null;
  };

  const onMove = (event: PointerEvent) => {
    if (event.buttons !== 0) return;
    const id = pickNodeId(event);
    if (id === hovered) return;
    hovered = id;
    stage.canvas.style.cursor = id ? "pointer" : "grab";
    sync();
  };
  const onLeave = () => {
    if (hovered === null) return;
    hovered = null;
    sync();
  };
  const onDown = (event: PointerEvent) => {
    pressedAt = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent) => {
    if (!pressedAt) return;
    const moved = Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y);
    pressedAt = null;
    if (moved > CLICK_DRAG_TOLERANCE_PX) return;
    // Clicking a step keeps its transitions lit; clicking empty space clears them.
    const id = pickNodeId(event);
    selected = id === selected ? null : id;
    sync();
  };

  stage.canvas.style.cursor = "grab";
  stage.canvas.addEventListener("pointermove", onMove);
  stage.canvas.addEventListener("pointerleave", onLeave);
  stage.canvas.addEventListener("pointerdown", onDown);
  stage.canvas.addEventListener("pointerup", onUp);

  return {
    setNavigation: (command) => stage.setNavigation(command),
    resetView: () => stage.flyTo(poseFor(separated, stage.aspect())),
    setSeparated: (next) => {
      separated = next;
      model.setSpread(next ? 1 : 0);
      stage.flyTo(poseFor(next, stage.aspect()));
    },
    dispose: () => {
      stage.canvas.removeEventListener("pointermove", onMove);
      stage.canvas.removeEventListener("pointerleave", onLeave);
      stage.canvas.removeEventListener("pointerdown", onDown);
      stage.canvas.removeEventListener("pointerup", onUp);
      model.dispose();
      stage.dispose();
    },
  };
}
