// Value: protects=a model that fails to build never leaks the running stage (canvas, observers, GL context); fails_when=createWorkflowScene stops disposing the stage, disposes it twice, or swallows the error; why_new=no test exercised the start-up failure path; seam=none
// Value: protects=a click selects the step under the pointer, a second click clears it, and a drag never selects; fails_when=CLICK_DRAG_TOLERANCE_PX handling, picking or the toggle regress; why_new=e2e cannot click individual meshes in WebGL; seam=none
// Value: protects=hover highlights only while no button is held, and every highlight change asks the stage for a frame; fails_when=dragging re-highlights or render-on-demand misses a highlight change; why_new=render on demand needs scene changes to invalidate the stage; seam=none
// Value: protects=Separate lanes, reset view, navigation and dispose reach the model and stage; fails_when=the controller stops forwarding or leaves listeners attached; why_new=no unit test drove the scene controller; seam=none
// Value: protects=without WebGL createStage throws and leaves nothing in the container; fails_when=the canvas is appended before the context is known or the error is swallowed; why_new=proves the no-WebGL fallback at the stage itself; seam=none
import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Stage, StageOptions } from "@/components/workflow-3d/stage";
import type { WorkflowModel } from "@/components/workflow-3d/model";

const STAGE = "@/components/workflow-3d/stage";
const COPY = { nodeLabels: {}, edgeLabels: {}, noteText: {} };
const CANVAS_SIZE = 100;
const CENTRE = CANVAS_SIZE / 2;

const { createStage, createWorkflowModel } = vi.hoisted(() => ({
  createStage: vi.fn<(container: HTMLElement, options: StageOptions) => Stage>(),
  createWorkflowModel: vi.fn<() => WorkflowModel>(),
}));

vi.mock("@/components/workflow-3d/stage", () => ({
  createStage: (container: HTMLElement, options: StageOptions) => createStage(container, options),
}));
vi.mock("@/components/workflow-3d/model", () => ({
  createWorkflowModel: () => createWorkflowModel(),
}));

const { createWorkflowScene } = await import("@/components/workflow-3d/scene");

/** A stage with a real canvas and camera, so picking runs the real raycast against real meshes. */
function fakeStage() {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: CANVAS_SIZE, height: CANVAS_SIZE }) as DOMRect;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const stage = {
    scene: new THREE.Scene(),
    camera,
    canvas,
    aspect: () => 1,
    onFrame: vi.fn(),
    invalidate: vi.fn(),
    setPose: vi.fn(),
    flyTo: vi.fn(),
    setNavigation: vi.fn(),
    dispose: vi.fn(),
  };
  createStage.mockReturnValue(stage);
  return stage;
}

/** A model whose only pickable is a real box at the origin, right under the canvas centre. */
function fakeModel(nodeId = "rights") {
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  body.userData.nodeId = nodeId;
  body.updateMatrixWorld();
  const model = {
    group: new THREE.Group(),
    pickables: [body],
    setSpread: vi.fn(),
    setActive: vi.fn(),
    update: vi.fn(() => false),
    dispose: vi.fn(),
  };
  createWorkflowModel.mockReturnValue(model);
  return model;
}

function pointer(target: HTMLElement, type: string, x: number, y: number, buttons = 0): void {
  target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, buttons, bubbles: true }));
}

function click(target: HTMLElement, from: [number, number], to: [number, number] = from): void {
  pointer(target, "pointerdown", ...from, 1);
  pointer(target, "pointerup", ...to);
}

afterEach(() => {
  createStage.mockReset();
  createWorkflowModel.mockReset();
});

describe("createWorkflowScene start-up", () => {
  it("disposes the stage exactly once and rethrows when the model cannot be built", () => {
    const stage = fakeStage();
    const failure = new Error("model failed");
    createWorkflowModel.mockImplementation(() => {
      throw failure;
    });

    expect(() =>
      createWorkflowScene(document.createElement("div"), { copy: COPY, reducedMotion: false }),
    ).toThrow(failure);
    expect(stage.dispose).toHaveBeenCalledTimes(1);
  });

  it("adds the model to the stage, drives it from frames and opens on the flat view", () => {
    const stage = fakeStage();
    const model = fakeModel();

    createWorkflowScene(document.createElement("div"), { copy: COPY, reducedMotion: false });

    expect(stage.scene.children).toContain(model.group);
    expect(stage.setPose).toHaveBeenCalledTimes(1);
    const frame = stage.onFrame.mock.calls[0]![0] as (t: number) => boolean;
    model.update.mockReturnValueOnce(true);
    expect(frame(2)).toBe(true);
    expect(model.update).toHaveBeenCalledWith(2);
  });

  // Value: protects=a lost WebGL context reaches the caller of createWorkflowScene; fails_when=onContextLost is not passed through to the stage; why_new=context loss was unhandled; seam=none
  it("hands the context-lost callback and the motion preference to the stage", () => {
    fakeStage();
    fakeModel();
    const onContextLost = vi.fn();

    createWorkflowScene(document.createElement("div"), {
      copy: COPY,
      reducedMotion: true,
      onContextLost,
    });

    expect(createStage).toHaveBeenCalledWith(expect.any(HTMLElement), {
      reducedMotion: true,
      onContextLost,
    });
  });
});

describe("createWorkflowScene pointer picking", () => {
  function setup() {
    const stage = fakeStage();
    const model = fakeModel("rights");
    const controller = createWorkflowScene(document.createElement("div"), {
      copy: COPY,
      reducedMotion: false,
    });
    return { stage, model, controller, canvas: stage.canvas };
  }

  it("selects the step under a click and asks for a frame", () => {
    const { model, stage, canvas } = setup();

    click(canvas, [CENTRE, CENTRE], [CENTRE + 3, CENTRE + 3]);

    expect(model.setActive).toHaveBeenLastCalledWith(null, "rights");
    expect(stage.invalidate).toHaveBeenCalled();
  });

  it("ignores a press that moved further than the click tolerance", () => {
    const { model, canvas } = setup();

    click(canvas, [CENTRE, CENTRE], [CENTRE + 6, CENTRE]);

    expect(model.setActive).not.toHaveBeenCalled();
  });

  it("clears the selection when the same step is clicked again", () => {
    const { model, canvas } = setup();

    click(canvas, [CENTRE, CENTRE]);
    click(canvas, [CENTRE, CENTRE]);

    expect(model.setActive).toHaveBeenLastCalledWith(null, null);
  });

  it("clears the selection when empty space is clicked", () => {
    const { model, canvas } = setup();

    click(canvas, [CENTRE, CENTRE]);
    click(canvas, [2, 2]);

    expect(model.setActive).toHaveBeenLastCalledWith(null, null);
  });

  // Value: protects=only the primary button selects, so a right-click menu or a short middle-button pan leaves the selection alone; fails_when=onDown or onUp stop checking event.button; why_new=any button toggled selection before; seam=none
  it("ignores right and middle clicks", () => {
    const { model, canvas } = setup();

    for (const button of [1, 2]) {
      canvas.dispatchEvent(
        new MouseEvent("pointerdown", { clientX: CENTRE, clientY: CENTRE, button, bubbles: true }),
      );
      canvas.dispatchEvent(
        new MouseEvent("pointerup", { clientX: CENTRE, clientY: CENTRE, button, bubbles: true }),
      );
    }

    expect(model.setActive).not.toHaveBeenCalled();
  });

  it("ignores a release that had no matching press", () => {
    const { model, canvas } = setup();

    pointer(canvas, "pointerup", CENTRE, CENTRE);

    expect(model.setActive).not.toHaveBeenCalled();
  });

  it("highlights on hover only while no button is held, and clears on leave", () => {
    const { model, stage, canvas } = setup();

    pointer(canvas, "pointermove", CENTRE, CENTRE, 1);
    expect(model.setActive).not.toHaveBeenCalled();

    pointer(canvas, "pointermove", CENTRE, CENTRE);
    expect(model.setActive).toHaveBeenLastCalledWith("rights", null);
    expect(canvas.style.cursor).toBe("pointer");
    expect(stage.invalidate).toHaveBeenCalledTimes(1);

    // Moving within the same step changes nothing, so no extra frame is requested.
    pointer(canvas, "pointermove", CENTRE + 1, CENTRE);
    expect(model.setActive).toHaveBeenCalledTimes(1);

    pointer(canvas, "pointermove", 2, 2);
    expect(model.setActive).toHaveBeenLastCalledWith(null, null);
    expect(canvas.style.cursor).toBe("grab");

    pointer(canvas, "pointermove", CENTRE, CENTRE);
    canvas.dispatchEvent(new MouseEvent("pointerleave"));
    expect(model.setActive).toHaveBeenLastCalledWith(null, null);
    const calls = model.setActive.mock.calls.length;
    canvas.dispatchEvent(new MouseEvent("pointerleave"));
    expect(model.setActive).toHaveBeenCalledTimes(calls);
  });
});

describe("createWorkflowScene controller", () => {
  it("forwards lane separation, reset and navigation, then tears everything down", () => {
    const stage = fakeStage();
    const model = fakeModel();
    const controller = createWorkflowScene(document.createElement("div"), {
      copy: COPY,
      reducedMotion: false,
    });

    controller.setSeparated(true);
    expect(model.setSpread).toHaveBeenLastCalledWith(1);
    expect(stage.invalidate).toHaveBeenCalled();
    const raised = stage.flyTo.mock.calls[0]![0] as { target: THREE.Vector3 };
    expect(raised.target.y).toBeGreaterThan(0);

    controller.resetView();
    expect(stage.flyTo.mock.calls[1]![0]).toEqual(raised);

    controller.setSeparated(false);
    expect(model.setSpread).toHaveBeenLastCalledWith(0);
    expect((stage.flyTo.mock.calls[2]![0] as { target: THREE.Vector3 }).target.y).toBe(0);

    controller.setNavigation("zoom-in");
    expect(stage.setNavigation).toHaveBeenLastCalledWith("zoom-in");

    controller.dispose();
    expect(model.dispose).toHaveBeenCalledTimes(1);
    expect(stage.dispose).toHaveBeenCalledTimes(1);
    click(stage.canvas, [CENTRE, CENTRE]);
    expect(model.setActive).not.toHaveBeenCalled();
  });
});

describe("createStage without WebGL (the real renderer)", () => {
  it("throws and leaves no canvas in the container", async () => {
    const real = await vi.importActual<typeof import("@/components/workflow-3d/stage")>(STAGE);
    const container = document.createElement("div");
    // jsdom has no WebGL context, exactly like a browser with WebGL disabled.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => real.createStage(container, { reducedMotion: false })).toThrow(/WebGL/);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.childElementCount).toBe(0);
    error.mockRestore();
  });
});
