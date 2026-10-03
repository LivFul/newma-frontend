"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import { slugFrom } from "./slug-from";

const Interactive = dynamic(() => import("./interactive"), { ssr: false, loading: () => null });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const IDLE_TIMEOUT_MS = 2000;

type IdleHandle = { cancel: () => void };

function whenIdle(callback: () => void): IdleHandle {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return { cancel: () => window.cancelIdleCallback(id) };
  }
  const id = window.setTimeout(callback, IDLE_TIMEOUT_MS);
  return { cancel: () => window.clearTimeout(id) };
}

// A failed chunk load must never take the page down: fall back to the static diagram, which is a
// complete, working layer on its own.
class StaticFallback extends Component<
  { fallback: ReactNode; onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Shows the static figure first. After idle, or on the first pointer, focus or touch intent, it loads
// the interactive twin and swaps it in within one commit. Hover and focus present at that moment seed
// the twin's state, so the view does not collapse at the swap. Under prefers-reduced-motion it never
// loads Motion at all (assumption A-P4-15).
export function HeroLoader({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState<EcosystemSlug | null>(null);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    let idle: IdleHandle | null = null;
    const apply = () => {
      idle?.cancel();
      idle = null;
      if (query.matches) {
        setLoad(false);
        setReady(false);
      } else {
        idle = whenIdle(() => setLoad(true));
      }
    };
    apply();
    query.addEventListener("change", apply);
    return () => {
      idle?.cancel();
      query.removeEventListener("change", apply);
    };
  }, []);

  const intent = useCallback(() => {
    if (!window.matchMedia(REDUCED_MOTION).matches) setLoad(true);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setHovering(true);
    intent();
  };
  const onFocus = (event: FocusEvent) => {
    setFocused(slugFrom(event.target));
    intent();
  };
  const staticLayer = ready ? null : children;

  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerLeave={() => setHovering(false)}
      onTouchStart={intent}
      onFocus={onFocus}
      onBlur={() => setFocused(null)}
    >
      {failed ? children : staticLayer}
      {load && !failed ? (
        <StaticFallback fallback={null} onError={() => setFailed(true)}>
          <Interactive
            onReady={onReady}
            swapped={ready}
            initialFocus={focused}
            initialHovering={hovering}
          />
        </StaticFallback>
      ) : null}
    </div>
  );
}
