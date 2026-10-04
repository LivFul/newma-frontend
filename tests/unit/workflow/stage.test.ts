// Value: protects=render on demand: an idle scene draws once and then stops asking for frames; fails_when=the stage redraws every frame while nothing changes; why_new=the render loop was continuous before this change; seam=none
// Value: protects=changes (invalidate, resize, orbit, highlight) draw exactly one more frame and animations keep frames coming until they finish; fails_when=a change is not drawn or an animation freezes mid-way; why_new=the render loop was continuous before this change; seam=none
// Value: protects=nothing is drawn off screen or in a hidden tab and the scene redraws on return; fails_when=the visibility pause leaks frames or never resumes; why_new=pausing now has to restart an idle loop; seam=none
// Value: protects=camera flights glide to the pose (or jump under reduced motion) and held navigation moves the camera; fails_when=a flight stops early or navigation stops drawing; why_new=no unit test drove the stage camera; seam=none
// Value: protects=dispose cancels the pending frame and frees the renderer and its canvas; fails_when=a frame fires after dispose or the GL context leaks; why_new=frame scheduling moved from setAnimationLoop to requestAnimationFrame; seam=none
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FakeRenderer {
  readonly domElement: HTMLCanvasElement;
  readonly render: ReturnType<typeof vi.fn>;
  readonly setSize: ReturnType<typeof vi.fn>;
  readonly dispose: ReturnType<typeof vi.fn>;
  readonly forceContextLoss: ReturnType<typeof vi.fn>;
}

// WebGL is the one thing jsdom cannot provide, so only the renderer is replaced; the camera,
// orbit controls and every other three.js object are real.
const renderers = vi.hoisted(() => [] as FakeRenderer[]);
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    toneMapping = 0;
    render = vi.fn();
    setSize = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    setPixelRatio() {}
    constructor() {
      renderers.push(this);
    }
  }
  return { ...actual, WebGLRenderer };
});

const THREE = await import("three");
const { createStage } = await import("@/components/workflow-3d/stage");

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let intersection: (entries: Array<{ isIntersecting: boolean }>) => void;
let resizeObserved: () => void;
let clock: number;

/** Runs every frame that is currently queued, as the browser would on the next vsync. */
function tick(ms = 16): void {
  clock += ms;
  const due = [...frames.values()];
  frames.clear();
  due.forEach((callback) => callback(clock));
}

function container(width = 800, height = 600): HTMLDivElement {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: height });
  return element;
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

const POSE = {
  position: new THREE.Vector3(0, 30, 30),
  target: new THREE.Vector3(0, 0, 0),
};

beforeEach(() => {
  renderers.length = 0;
  frames = new Map();
  nextFrameId = 1;
  clock = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersection) {
        intersection = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resizeObserved = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  setHidden(false);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function start(reducedMotion = false) {
  const element = container();
  const stage = createStage(element, { reducedMotion });
  const renderer = renderers[0]!;
  return { element, stage, renderer };
}

describe("createStage render on demand", () => {
  it("draws the first frame, then idles with no frame queued", () => {
    const { element, stage, renderer } = start(true);
    stage.setPose(POSE);

    expect(element.querySelector("canvas")).toBe(renderer.domElement);
    expect(renderer.setSize).toHaveBeenCalledWith(800, 600);
    expect(stage.aspect()).toBeCloseTo(800 / 600);
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    tick();
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    stage.dispose();
  });

  it("draws exactly one more frame for each invalidate and for a resize", () => {
    const { stage, renderer } = start(true);
    tick();

    stage.invalidate();
    stage.invalidate();
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);

    resizeObserved();
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(3);
    stage.dispose();
  });

  it("keeps drawing while a frame callback moves things and stops after a still frame", () => {
    const { stage, renderer } = start(true);
    tick();
    let moves = 2;
    const callback = vi.fn(() => {
      moves -= 1;
      return moves >= 0;
    });
    stage.onFrame(callback);

    tick();
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(3);
    // The third frame moves nothing: it is not drawn and no further frame is asked for.
    tick();
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenLastCalledWith(clock / 1000);
    expect(renderer.render).toHaveBeenCalledTimes(3);
    expect(frames.size).toBe(0);
    stage.dispose();
  });

  it("draws an orbit change from the controls", () => {
    const { stage, renderer } = start(true);
    stage.setPose(POSE);
    tick();

    const before = stage.camera.position.clone();

    // A Ctrl+wheel reaches the real OrbitControls, which zoom and emit "change".
    stage.canvas.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 100 }),
    );
    tick();

    expect(stage.camera.position.distanceTo(before)).toBeGreaterThan(0);
    expect(renderer.render).toHaveBeenCalledTimes(2);
    stage.dispose();
  });
});

describe("createStage visibility pause", () => {
  it("draws nothing off screen and redraws when the scene scrolls back", () => {
    const { stage, renderer } = start(true);
    stage.onFrame(() => true);
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(1);

    intersection([{ isIntersecting: false }]);
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    intersection([{ isIntersecting: true }]);
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    stage.dispose();
  });

  it("draws nothing in a hidden tab and redraws when it is shown", () => {
    const { stage, renderer } = start(true);
    tick();

    setHidden(true);
    stage.invalidate();
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    setHidden(false);
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    stage.dispose();
  });
});

describe("createStage camera", () => {
  it("glides to a pose over several frames, then idles", () => {
    const { stage, renderer } = start(false);
    stage.setPose(POSE);
    tick();
    const destination = {
      position: new THREE.Vector3(20, 20, 0),
      target: new THREE.Vector3(1, 0, 1),
    };

    stage.flyTo(destination);
    tick(300);
    expect(stage.camera.position.distanceTo(destination.position)).toBeGreaterThan(0.5);
    for (let i = 0; i < 120 && frames.size > 0; i += 1) tick(50);

    expect(stage.camera.position.distanceTo(destination.position)).toBeLessThan(1e-6);
    expect(renderer.render.mock.calls.length).toBeGreaterThan(3);
    expect(frames.size).toBe(0);
    stage.dispose();
  });

  it("jumps straight to the pose under reduced motion", () => {
    const { stage } = start(true);
    const destination = {
      position: new THREE.Vector3(10, 25, 10),
      target: new THREE.Vector3(),
    };

    stage.flyTo(destination);

    expect(stage.camera.position.distanceTo(destination.position)).toBeLessThan(1e-6);
    stage.dispose();
  });

  it("moves the camera while a navigation command is held and idles once released", () => {
    const { stage, renderer } = start(true);
    stage.setPose(POSE);
    tick();
    const startDistance = stage.camera.position.length();

    stage.setNavigation("zoom-in");
    tick();
    tick();
    tick();
    expect(stage.camera.position.length()).toBeLessThan(startDistance);

    const beforePan = stage.camera.position.clone();
    stage.setNavigation("pan-right");
    tick();
    tick();
    expect(stage.camera.position.x).toBeGreaterThan(beforePan.x);

    const beforeTilt = stage.camera.position.clone();
    stage.setNavigation("tilt-down");
    tick();
    tick();
    expect(stage.camera.position.y).toBeLessThan(beforeTilt.y);

    for (const command of ["pan-left", "pan-up", "pan-down", "tilt-up", "zoom-out"] as const) {
      const before = stage.camera.position.clone();
      stage.setNavigation(command);
      tick();
      tick();
      expect(stage.camera.position.distanceTo(before)).toBeGreaterThan(0);
    }

    stage.setNavigation(null);
    tick();
    tick();
    const renders = renderer.render.mock.calls.length;
    tick();
    expect(renderer.render).toHaveBeenCalledTimes(renders);
    expect(frames.size).toBe(0);
    stage.dispose();
  });

  it("lets the wheel scroll the page unless Ctrl or Cmd is held", () => {
    const { stage } = start(true);
    const reached = vi.fn();
    stage.canvas.addEventListener("wheel", reached);

    stage.canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
    expect(reached).not.toHaveBeenCalled();
    stage.canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, ctrlKey: true }));
    expect(reached).toHaveBeenCalledTimes(1);
    stage.dispose();
  });
});

describe("createStage dispose", () => {
  it("cancels the pending frame and frees the renderer and its canvas", () => {
    const { element, stage, renderer } = start(true);
    stage.invalidate();
    expect(frames.size).toBe(1);

    stage.dispose();

    expect(frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(element.querySelector("canvas")).toBeNull();
  });
});
