"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import type { SceneFailure, WorkflowSceneProps } from "@/components/workflow-3d/workflow-scene";

export interface WorkflowViewerLabels {
  readonly explore: string;
  readonly close: string;
  readonly loading: string;
  readonly ready: string;
  readonly failed: string;
  readonly unavailable: string;
}

// "starting" has the scene mounted while its renderer starts, but still reads as loading: only a
// renderer that really started is announced as ready. "unavailable" means the renderer could not
// start in this browser (no WebGL), which a retry would not fix.
type Phase = "idle" | "loading" | "starting" | "ready" | "failed" | "unavailable";
type SceneModule = typeof import("@/components/workflow-3d/workflow-scene");

const STATUS: Readonly<Record<Phase, keyof WorkflowViewerLabels | null>> = {
  idle: null,
  loading: "loading",
  starting: "loading",
  ready: "ready",
  failed: "failed",
  unavailable: "failed",
};

let pending: Promise<SceneModule> | null = null;
// Set once the renderer has failed in this page; the browser will not grow WebGL on a second click.
let rendererUnavailable = false;

// False on the server and during hydration, true afterwards, with no effect and no flash of the
// wrong state. Without JavaScript the explore button therefore never appears, as on the hero.
const subscribeNothing = () => () => undefined;
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

/** A chunk that has not arrived by now is treated as lost, so the visitor is never left waiting. */
const LOAD_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("The scene took too long to load")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// True when the visitor has asked the browser to save data: nothing is fetched speculatively then.
const prefersSavedData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

// True when any part of the element is inside the viewport.
function isOnScreen(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

// The three-dimensional scene is a separate chunk that loads only on the visitor's intent (a click,
// or the pointer or keyboard focus reaching the button). It is a plain import(), not next/dynamic:
// scripts/check-hero-bundle.mjs counts every next/dynamic chunk on the home route against the 80 KiB
// hero budget, and an intent-only import keeps the idle scripts of the home page exactly as they were
// (assumption A-W-02). One shared request serves hover, focus and click, and a failed or timed-out
// load can be retried.
function loadScene(): Promise<SceneModule> {
  pending ??= withTimeout(import("@/components/workflow-3d/workflow-scene"), LOAD_TIMEOUT_MS).catch(
    (error: unknown) => {
      pending = null;
      throw error;
    },
  );
  return pending;
}

/** The smallest the scene box gets when it cannot simply take the diagram's height. */
const MIN_SCENE_PX = 416;
const MAX_SCENE_VIEWPORT_SHARE = 0.8;

// Measured just before the swap, so the scene takes the diagram's block size and nothing below it
// moves. Where the diagram scrolls sideways (phones) it is far taller than the screen is wide, so the
// scene is capped to most of the viewport instead.
function sceneHeightFor(diagram: HTMLElement | null): number | undefined {
  const height = diagram?.getBoundingClientRect().height;
  if (!diagram || !height) return undefined;
  const region = diagram.firstElementChild;
  const scrolls = region instanceof HTMLElement && region.scrollWidth > region.clientWidth + 1;
  if (!scrolls) return height;
  return Math.min(height, Math.max(MIN_SCENE_PX, window.innerHeight * MAX_SCENE_VIEWPORT_SHARE));
}

const sceneShown = (phase: Phase) => phase === "starting" || phase === "ready";

export function WorkflowViewer({
  children,
  labels,
  aspect,
}: {
  children: ReactNode;
  labels: WorkflowViewerLabels;
  aspect: string;
}) {
  const hydrated = useHydrated();
  const [phase, setPhase] = useState<Phase>(() => (rendererUnavailable ? "unavailable" : "idle"));
  const [Scene, setScene] = useState<ComponentType<WorkflowSceneProps> | null>(null);
  const [sceneHeight, setSceneHeight] = useState<number | undefined>(undefined);
  const wrapper = useRef<HTMLDivElement>(null);
  const diagram = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  const open = useCallback(async () => {
    setPhase("loading");
    try {
      const loaded = await loadScene();
      setSceneHeight(sceneHeightFor(diagram.current));
      setScene(() => loaded.WorkflowScene);
      setPhase("starting");
    } catch {
      setPhase("failed");
    }
  }, []);

  const close = useCallback(() => setPhase("idle"), []);
  const ready = useCallback(
    () => setPhase((current) => (current === "starting" ? "ready" : current)),
    [],
  );
  // Only a missing WebGL context is remembered; any other start-up error stays retryable.
  const sceneFailed = useCallback((reason: SceneFailure) => {
    if (reason === "no-webgl") rendererUnavailable = true;
    setPhase(reason === "no-webgl" ? "unavailable" : "failed");
  }, []);
  // Warm the chunk on intent so the click feels instant. Nothing loads until the pointer or focus
  // reaches the button, and not at all for visitors who asked the browser to save data.
  const prefetch = useCallback(() => {
    if (prefersSavedData() || rendererUnavailable) return;
    loadScene().catch(() => undefined);
  }, []);

  // Escape closes the scene, but only when it was meant for the viewer: focus is inside it, or on the
  // page itself while the viewer is at least partly on screen, and no other widget has handled the key.
  useEffect(() => {
    if (phase !== "ready") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const viewer = wrapper.current;
      if (!viewer) return;
      const focused = document.activeElement;
      if (viewer.contains(focused) || (focused === document.body && isOnScreen(viewer))) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, close]);

  // Leaving the scene unmounts whatever had focus inside it, which would drop focus to the page top
  // (WCAG 2.4.3). The explore button is always still there, so focus goes back to it, without pulling
  // the page back to it when the visitor has scrolled away.
  const previousPhase = useRef<Phase>(phase);
  useEffect(() => {
    const button = toggle.current;
    if (button && sceneShown(previousPhase.current) && !sceneShown(phase)) {
      button.focus({ preventScroll: !isOnScreen(button) });
    }
    previousPhase.current = phase;
  }, [phase]);

  const statusKey = STATUS[phase];
  const status = statusKey ? labels[statusKey] : "";
  const busy = phase === "loading" || phase === "starting";
  const inert = busy || phase === "unavailable";
  const buttonLabel =
    phase === "ready"
      ? labels.close
      : phase === "unavailable"
        ? labels.unavailable
        : labels.explore;

  return (
    <div ref={wrapper} data-workflow-viewer data-phase={phase} className="space-y-3">
      {/* The row keeps its height whether or not the button has appeared, so hydration shifts nothing. */}
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p role="status" className="min-h-6 max-w-[58ch] text-sm text-fg-muted">
          {status}
        </p>
        {hydrated ? (
          <Button
            ref={toggle}
            variant="secondary"
            className="min-h-11"
            aria-disabled={inert || undefined}
            onClick={() => {
              if (inert) return;
              if (phase === "ready") close();
              else void open();
            }}
            onPointerEnter={prefetch}
            onFocus={prefetch}
          >
            {buttonLabel}
          </Button>
        ) : null}
      </div>
      {sceneShown(phase) && Scene ? (
        <Scene aspect={aspect} height={sceneHeight} onReady={ready} onFailure={sceneFailed} />
      ) : (
        <div ref={diagram}>{children}</div>
      )}
    </div>
  );
}
