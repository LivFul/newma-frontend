import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCENE_COLORS } from "./palette";

const MAX_PIXEL_RATIO = 2;
const FLIGHT_MS = 900;
/** Pan speed as a fraction of the camera-to-target distance per second. */
const PAN_RATE = 0.5;
const TILT_RATE_RAD_PER_SEC = 0.9;
/** Zoom speed in natural-log distance units per second. */
const ZOOM_RATE = 1.2;
const MIN_POLAR_ANGLE = 0.02;
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

export interface StageOptions {
  /** Camera moves jump instead of gliding, and orbit damping is off. */
  readonly reducedMotion: boolean;
}

export interface Stage {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  /** Width over height of the canvas. */
  aspect(): number;
  onFrame(callback: (timeSeconds: number) => void): void;
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

export function createStage(container: HTMLElement, options: StageOptions): Stage {
  // Throws when WebGL is unavailable; the caller turns that into a fallback to the static diagram.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // Everything created from here on registers a cleanup, so a failure part-way through start-up
  // releases the renderer, the render loop, the observers and the listeners instead of leaking them.
  const cleanups: Array<() => void> = [
    () => {
      renderer.setAnimationLoop(null);
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
    scene.fog = new THREE.Fog(SCENE_COLORS.background, 90, 190);
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
    controls.minDistance = 6;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI * 0.495;
    // One-finger vertical drags scroll the page instead of being captured by the scene.
    renderer.domElement.style.touchAction = "pan-y";

    // The wheel scrolls the page unless Ctrl or Cmd is held, so the scene never traps scrolling.
    const guardWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) event.stopImmediatePropagation();
    };
    container.addEventListener("wheel", guardWheel, { capture: true });
    cleanups.push(() => container.removeEventListener("wheel", guardWheel, { capture: true }));

    const frameCallbacks: Array<(timeSeconds: number) => void> = [];
    let flight: Flight | null = null;
    let navigation: NavCommand | null = null;
    let lastFrameMs = 0;
    let onScreen = true;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    const sizeObserver = new ResizeObserver(resize);
    cleanups.push(() => sizeObserver.disconnect());
    sizeObserver.observe(container);
    resize();

    // Nothing is drawn while the scene is off screen or the tab is hidden.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
    });
    cleanups.push(() => visibilityObserver.disconnect());
    visibilityObserver.observe(container);

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

    renderer.setAnimationLoop((now) => {
      const seconds = Math.min((now - lastFrameMs) / 1000, MAX_FRAME_SECONDS);
      lastFrameMs = now;
      if (!onScreen || document.hidden) return;
      stepFlight(now);
      if (navigation) applyNavigation(navigation, seconds);
      controls.update();
      frameCallbacks.forEach((callback) => callback(now / 1000));
      renderer.render(scene, camera);
    });

    const setPose = (pose: CameraPose) => {
      flight = null;
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      controls.update();
    };

    return {
      scene,
      camera,
      canvas: renderer.domElement,
      aspect: () => camera.aspect,
      onFrame: (callback) => {
        frameCallbacks.push(callback);
      },
      setPose,
      flyTo: (pose) => {
        if (options.reducedMotion) {
          setPose(pose);
          return;
        }
        flight = {
          fromPosition: camera.position.clone(),
          fromTarget: controls.target.clone(),
          pose,
          startedAt: performance.now(),
        };
      },
      setNavigation: (command) => {
        navigation = command;
        // Manual control wins over any glide still in flight.
        if (command) flight = null;
      },
      dispose: release,
    };
  } catch (error) {
    release();
    throw error;
  }
}
