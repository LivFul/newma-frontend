"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { isEcosystemSlug, type EcosystemSlug } from "@/content/ecosystem/registry";

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

const slugFrom = (target: EventTarget | null): EcosystemSlug | null => {
  const slug = (target as Element | null)?.closest?.("[data-slug]")?.getAttribute("data-slug");
  return slug && isEcosystemSlug(slug) ? slug : null;
};

// Shows the static figure first. After idle, or on the first pointer, focus or touch intent, it loads
// the interactive twin and swaps it in within one commit. Under prefers-reduced-motion it never loads
// Motion at all (assumption A-P4-15).
export function HeroLoader({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const focusedSlug = useRef<EcosystemSlug | null>(null);
  const [restoreFocus, setRestoreFocus] = useState<EcosystemSlug | null>(null);

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
  const trackFocus = (event: FocusEvent) => {
    focusedSlug.current = slugFrom(event.target);
    intent();
  };
  const onReady = useCallback(() => {
    setRestoreFocus(focusedSlug.current);
    setReady(true);
  }, []);

  return (
    <div
      onPointerEnter={intent}
      onTouchStart={intent}
      onFocus={trackFocus}
      onBlur={() => {
        focusedSlug.current = null;
      }}
    >
      {ready ? null : children}
      {load ? <Interactive onReady={onReady} swapped={ready} initialFocus={restoreFocus} /> : null}
    </div>
  );
}
