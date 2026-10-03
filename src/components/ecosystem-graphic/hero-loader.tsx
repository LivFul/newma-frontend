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

// Load triggers: after idle, or on the first pointer, focus or touch intent; never under
// prefers-reduced-motion, and switched off again if that preference turns on mid-session.
function useLoadTrigger() {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);

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
  return { load, ready, intent, onReady } as const;
}

// Shows the static figure first, then swaps in the interactive twin within one commit. Hover and focus
// present at that moment seed the twin's state, so the view does not collapse at the swap
// (assumption A-P4-15: under reduced motion Motion is never loaded).
export function HeroLoader({ children }: { children: ReactNode }) {
  const { load, ready, intent, onReady } = useLoadTrigger();
  const [failed, setFailed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState<EcosystemSlug | null>(null);

  const onPointerOver = (event: PointerEvent) => {
    // Only the diagram itself explodes by hover in the static layer, so only it seeds the twin.
    const overDiagram = (event.target as Element).closest(".eco-frame") !== null;
    setHovering(event.pointerType !== "touch" && overDiagram);
    intent();
  };
  const onFocus = (event: FocusEvent) => {
    setFocused(slugFrom(event.target));
    intent();
  };

  return (
    <div
      onPointerOver={onPointerOver}
      onPointerLeave={() => setHovering(false)}
      onTouchStart={intent}
      onFocus={onFocus}
      onBlur={() => setFocused(null)}
    >
      {failed || !ready ? children : null}
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
