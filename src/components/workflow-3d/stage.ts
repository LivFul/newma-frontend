import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCENE_COLORS } from "./palette";

const MAX_PIXEL_RATIO = 2;
/** Drawing-buffer budget (device pixels). The canvas breaks out to 95vw, so on a large monitor its CSS
 * box alone is about twice the old column's; trading resolution for size keeps the per-frame fill (and
 * the antialiasing buffers) near what the column cost. */
const MAX_DRAWING_PIXELS = 4_000_000;
const FLIGHT_MS = 900;
/** Pan speed as a fraction of the camera-to-target distance per second. */
const PAN_RATE = 0.5;
const TILT_RATE_RAD_PER_SEC = 0.9;
/** Zoom speed in natural-log distance units per second. */
const ZOOM_RATE = 1.2;
const MIN_POLAR_ANGLE = 0.02;
const MIN_DISTANCE = 6;
/** Zoom-out limit for a typical canvas; tall narrow canvases raise it so their overview fits. */
const BASE_MAX_DISTANCE = 140;
/** Room to zoom out past the farthest pose the scene has asked for. */
const MAX_DISTANCE_MARGIN = 1.15;
const FOG_NEAR = 90;
const FOG_FAR = 190;
/** Caps the step after a stalled frame so a held button never jumps. */
const MAX_FRAME_SECONDS = 0.1;

export type NavCommand =
  | "pan-left"
  | "pan-right"
  | "pan-up"
  | "pan-down"
  | "tilt-up"
  | "tilt-down"
  | "zoom-in"
  | "zoom-out";

export interface CameraPose {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
}

/** Returns true when it changed the scene this frame, so the frame is drawn and another follows. */
export type FrameCallback = (timeSeconds: number) => boolean;

export interface StageOptions {
  /** Camera moves jump instead of gliding, and orbit damping is off. */
  readonly reducedMotion: boolean;
  /**
   * Called when the browser takes the WebGL context away (GPU reset, too many contexts). The canvas
   * stays blank from then on, so the caller should give up on the scene.
   */
  readonly onContextLost?: () => void;
}

export interface Stage {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  /** Width over height of the canvas. */
  aspect(): number;
  /**
   * Runs before each frame. A callback returns true when it moved something, which draws the frame
   * and asks for the next; once a frame moves nothing the stage idles until invalidated.
   */
  onFrame(callback: FrameCallback): void;
  /** Asks for one more frame because something in the scene changed. */
  invalidate(): void;
  setPose(pose: CameraPose): void;
  flyTo(pose: CameraPose): void;
  /** Moves the camera continuously while a command is set; null stops. */
  setNavigation(command: NavCommand | null): void;
  dispose(): void;
}

interface Flight {
  readonly fromPosition: THREE.Vector3;
  readonly fromTarget: THREE.Vector3;
  readonly pose: CameraPose;
  readonly startedAt: number;
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** The camera axis flattened onto the ground, so panning never lifts the view off the diagram. */
function groundAxis(camera: THREE.Camera, column: 0 | 1, fallback: THREE.Vector3): THREE.Vector3 {
  const axis = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, column);
  axis.y = 0;
  return axis.lengthSq() < 1e-6 ? fallback.clone() : axis.normalize();
}

/** The renderer's pixel ratio for a canvas of this CSS size: the device ratio, capped at
 * MAX_PIXEL_RATIO and at whatever keeps the buffer within MAX_DRAWING_PIXELS, but never below 1 (or the
 * device's own ratio when that is lower), so a large canvas trades sharpness, not legibility. */
export function pixelRatioFor(width: number, height: number, deviceRatio: number): number {
  const ratio = Math.min(deviceRatio, MAX_PIXEL_RATIO);
  const budget = Math.sqrt(MAX_DRAWING_PIXELS / (width * height));
  return Math.max(Math.min(ratio, 1), Math.min(ratio, budget));
}

export function createStage(container: HTMLElement, options: StageOptions): Stage {
  // Throws when WebGL is unavailable; the caller turns that into a fallback to the static diagram.
  // The pixel ratio and size come from the first resize() below, within the drawing budget.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // Everything created from here on registers a cleanup, so a failure part-way through start-up
  // releases the renderer, the render loop, the observers and the listeners instead of leaking them.
  const cleanups: Array<() => void> = [
    () => {
      renderer.dispose();
      // dispose() frees buffers but not the context, and browsers cap live contexts.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  ];
  const release = () => {
    while (cleanups.length > 0) cleanups.pop()?.();
  };

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_COLORS.background);
    const fog = new THREE.Fog(SCENE_COLORS.background, FOG_NEAR, FOG_FAR);
    scene.fog = fog;
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x1a1c24, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(15, 30, 20);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    const controls = new OrbitControls(camera, renderer.domElement);
    cleanups.push(() => controls.dispose());
    controls.enableDamping = !options.reducedMotion;
    controls.dampingFactor = 0.08;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = BASE_MAX_DISTANCE;
    controls.maxPolarAngle = Math.PI * 0.495;
    // One-finger vertical drags scroll the page instead of being captured by the scene.
    renderer.domElement.style.touchAction = "pan-y";

    // The wheel scrolls the page unless Ctrl or Cmd is held, so the scene never traps scrolling.
    const guardWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) event.stopImmediatePropagation();
    };
    container.addEventListener("wheel", guardWheel, { capture: true });
    cleanups.push(() => container.removeEventListener("wheel", guardWheel, { capture: true }));

    // A lost context leaves a blank canvas that would still be announced as working. preventDefault
    // keeps the context restorable, but the caller is told so it can bring the diagram back.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      options.onContextLost?.();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    cleanups.push(() => renderer.domElement.removeEventListener("webglcontextlost", onContextLost));

    const frameCallbacks: FrameCallback[] = [];
    let flight: Flight | null = null;
    let navigation: NavCommand | null = null;
    let onScreen = true;

    // Frames are drawn on demand: a change asks for one frame, and frames keep coming only while
    // something is moving (a flight, held navigation, orbit damping or a callback still animating).
    // The flowing particles count as moving, so the loop truly idles under reduced motion (no
    // particles) and, like before, whenever the scene is off screen or the tab is hidden.
    let frameId: number | null = null;
    /** Null while idle, so the first frame after a pause takes no time step. */
    let lastFrameMs: number | null = null;
    let needsRender = true;
    cleanups.push(() => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    });
    const requestFrame = () => {
      if (frameId === null) frameId = requestAnimationFrame(drawFrame);
    };
    const invalidate = () => {
      needsRender = true;
      requestFrame();
    };
    controls.addEventListener("change", invalidate);
    cleanups.push(() => controls.removeEventListener("change", invalidate));

    // The size the drawing buffer was last allocated at, so a callback that changes nothing is skipped.
    let drawnAt = "";
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      // setDrawingBufferSize sets the size and the budgeted ratio together, so the buffer is allocated
      // once per resize (setPixelRatio would first reallocate it at the old size, then setSize again).
      // It leaves the canvas's CSS size alone, which setSize would otherwise have set.
      const ratio = pixelRatioFor(clientWidth, clientHeight, window.devicePixelRatio);
      const size = `${clientWidth}x${clientHeight}@${ratio}`;
      if (size === drawnAt) return;
      drawnAt = size;
      renderer.setDrawingBufferSize(clientWidth, clientHeight, ratio);
      renderer.domElement.style.width = `${clientWidth}px`;
      renderer.domElement.style.height = `${clientHeight}px`;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      // Resizing clears the drawing buffer, so the frame must be drawn again.
      invalidate();
    };
    const sizeObserver = new ResizeObserver(resize);
    cleanups.push(() => sizeObserver.disconnect());
    sizeObserver.observe(container);
    resize();

    // Nothing is drawn while the scene is off screen or the tab is hidden; coming back draws again.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) invalidate();
    });
    cleanups.push(() => visibilityObserver.disconnect());
    visibilityObserver.observe(container);
    const onVisibilityChange = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));

    const stepFlight = (now: number) => {
      if (!flight) return;
      const progress = Math.min(1, (now - flight.startedAt) / FLIGHT_MS);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(flight.fromPosition, flight.pose.position, eased);
      controls.target.lerpVectors(flight.fromTarget, flight.pose.target, eased);
      if (progress >= 1) flight = null;
    };

    const applyNavigation = (command: NavCommand, seconds: number) => {
      const offset = camera.position.clone().sub(controls.target);

      if (command === "zoom-in" || command === "zoom-out") {
        const sign = command === "zoom-in" ? -1 : 1;
        const distance = THREE.MathUtils.clamp(
          offset.length() * Math.exp(sign * ZOOM_RATE * seconds),
          controls.minDistance,
          controls.maxDistance,
        );
        camera.position.copy(controls.target).add(offset.setLength(distance));
        return;
      }

      if (command === "tilt-up" || command === "tilt-down") {
        // Tilt up swings the camera over the diagram (towards top-down); tilt down lowers it.
        const sign = command === "tilt-up" ? -1 : 1;
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi + sign * TILT_RATE_RAD_PER_SEC * seconds,
          MIN_POLAR_ANGLE,
          controls.maxPolarAngle,
        );
        camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
        return;
      }

      camera.updateMatrixWorld();
      const step = offset.length() * PAN_RATE * seconds;
      const right = groundAxis(camera, 0, new THREE.Vector3(1, 0, 0));
      const forward = groundAxis(camera, 1, new THREE.Vector3(0, 0, -1));
      const move = new THREE.Vector3();
      if (command === "pan-left") move.addScaledVector(right, -step);
      if (command === "pan-right") move.addScaledVector(right, step);
      if (command === "pan-up") move.addScaledVector(forward, step);
      if (command === "pan-down") move.addScaledVector(forward, -step);
      camera.position.add(move);
      controls.target.add(move);
    };

    function drawFrame(now: number): void {
      frameId = null;
      if (!onScreen || document.hidden) {
        // Paused: the visibility handlers ask for a frame again when the scene comes back.
        lastFrameMs = null;
        return;
      }
      const seconds =
        lastFrameMs === null ? 0 : Math.min((now - lastFrameMs) / 1000, MAX_FRAME_SECONDS);
      lastFrameMs = now;

      stepFlight(now);
      if (navigation) applyNavigation(navigation, seconds);
      // True while the camera is still moving, which includes orbit damping after a drag.
      const cameraMoved = controls.update();
      let animating = false;
      for (const callback of frameCallbacks) {
        if (callback(now / 1000)) animating = true;
      }

      const moving = cameraMoved || animating || flight !== null || navigation !== null;
      if (needsRender || moving) renderer.render(scene, camera);
      needsRender = false;
      if (moving) requestFrame();
      else lastFrameMs = null;
    }

    // OrbitControls clamps every update to maxDistance, so a pose farther out than the cap (the
    // overview on a tall narrow canvas) raises it first; the fog moves out with it.
    const allowDistance = (pose: CameraPose) => {
      const cap = Math.max(
        BASE_MAX_DISTANCE,
        pose.position.distanceTo(pose.target) * MAX_DISTANCE_MARGIN,
      );
      if (cap <= controls.maxDistance) return;
      const scale = cap / BASE_MAX_DISTANCE;
      controls.maxDistance = cap;
      fog.near = FOG_NEAR * scale;
      fog.far = FOG_FAR * scale;
    };

    const setPose = (pose: CameraPose) => {
      allowDistance(pose);
      flight = null;
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      controls.update();
      invalidate();
    };

    requestFrame();

    return {
      scene,
      camera,
      canvas: renderer.domElement,
      aspect: () => camera.aspect,
      onFrame: (callback) => {
        frameCallbacks.push(callback);
        invalidate();
      },
      invalidate,
      setPose,
      flyTo: (pose) => {
        if (options.reducedMotion) {
          setPose(pose);
          return;
        }
        allowDistance(pose);
        flight = {
          fromPosition: camera.position.clone(),
          fromTarget: controls.target.clone(),
          pose,
          startedAt: performance.now(),
        };
        requestFrame();
      },
      setNavigation: (command) => {
        navigation = command;
        // Manual control wins over any glide still in flight.
        if (command) flight = null;
        requestFrame();
      },
      dispose: release,
    };
  } catch (error) {
    release();
    throw error;
  }
}
