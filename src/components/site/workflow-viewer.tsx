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
import type { WorkflowSceneProps } from "@/components/workflow-3d/workflow-scene";

export interface WorkflowViewerLabels {
  readonly explore: string;
  readonly close: string;
  readonly loading: string;
  readonly ready: string;
  readonly failed: string;
}

type Phase = "idle" | "loading" | "ready" | "failed";
type SceneModule = typeof import("@/components/workflow-3d/workflow-scene");

let pending: Promise<SceneModule> | null = null;

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [Scene, setScene] = useState<ComponentType<WorkflowSceneProps> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const open = useCallback(async () => {
    setPhase("loading");
    try {
      const loaded = await loadScene();
      if (!mounted.current) return;
      setScene(() => loaded.WorkflowScene);
      setPhase("ready");
    } catch {
      if (mounted.current) setPhase("failed");
    }
  }, []);

  const close = useCallback(() => setPhase("idle"), []);
  const fail = useCallback(() => setPhase("failed"), []);
  // Warm the chunk on intent so the click feels instant. Nothing loads until the pointer or focus
  // reaches the button, and not at all for visitors who asked the browser to save data.
  const prefetch = useCallback(() => {
    if (prefersSavedData()) return;
    loadScene().catch(() => undefined);
  }, []);

  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Escape closes the scene, but only when it was meant for the viewer: focus is inside it (or on the
  // page itself), and no other widget has already handled the key.
  useEffect(() => {
    if (phase !== "ready") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const focused = document.activeElement;
      if (focused === document.body || wrapper.current?.contains(focused)) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, close]);

  // Leaving the scene unmounts whatever had focus inside it, which would drop focus to the page top
  // (WCAG 2.4.3). The explore button is always still there, so focus goes back to it.
  const previousPhase = useRef<Phase>("idle");
  useEffect(() => {
    if (previousPhase.current === "ready" && phase !== "ready") toggle.current?.focus();
    previousPhase.current = phase;
  }, [phase]);

  const status =
    phase === "loading"
      ? labels.loading
      : phase === "ready"
        ? labels.ready
        : phase === "failed"
          ? labels.failed
          : "";
  const busy = phase === "loading";

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
            aria-disabled={busy || undefined}
            onClick={() => {
              if (busy) return;
              if (phase === "ready") close();
              else void open();
            }}
            onPointerEnter={prefetch}
            onFocus={prefetch}
          >
            {phase === "ready" ? labels.close : labels.explore}
          </Button>
        ) : null}
      </div>
      {phase === "ready" && Scene ? <Scene aspect={aspect} onFailure={fail} /> : children}
    </div>
  );
}
