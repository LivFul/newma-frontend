"use client";

import { useEffect, useLayoutEffect, type Dispatch, type RefObject } from "react";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import type { HeroView } from "./part-props";
import type { HeroEffect, HeroEvent } from "./state";

export function link(root: HTMLElement | null, slug: EcosystemSlug): HTMLAnchorElement | null {
  return root?.querySelector<HTMLAnchorElement>(`[data-slug="${slug}"] > a`) ?? null;
}

/** Reports ready before paint (so the loader drops the static layer) and restores focus after the swap. */
export function useSwapLifecycle(
  frameRef: RefObject<HTMLDivElement | null>,
  {
    onReady,
    swapped,
    restoreSlug,
  }: { onReady: () => void; swapped: boolean; restoreSlug: EcosystemSlug | null },
) {
  useLayoutEffect(() => {
    onReady();
  }, [onReady]);
  useLayoutEffect(() => {
    if (swapped && restoreSlug) link(frameRef.current, restoreSlug)?.focus();
  }, [frameRef, swapped, restoreSlug]);
}

// Moving focus is the one effect the reducer asks for. Focus without scrolling, then bring the link
// into view once the explode has settled, because the browser would otherwise scroll to the
// pre-explosion position.
export function useFocusEffect(
  effect: HeroEffect,
  frameRef: RefObject<HTMLDivElement | null>,
  settleSeconds: number,
) {
  useEffect(() => {
    if (effect.type !== "focus") return;
    const target = link(frameRef.current, effect.slug);
    target?.focus({ preventScroll: true });
    const timer = window.setTimeout(
      () => target?.scrollIntoView({ block: "nearest", inline: "nearest" }),
      settleSeconds * 1000 + 50,
    );
    return () => window.clearTimeout(timer);
  }, [effect, frameRef, settleSeconds]);
}

// While exploded: a pointerdown outside collapses a touch-opened view, and Escape reassembles from
// anywhere on the page (WCAG 1.4.13), not only from inside the figure.
export function useDismissals(
  view: HeroView,
  frameRef: RefObject<HTMLDivElement | null>,
  dispatch: Dispatch<HeroEvent>,
) {
  useEffect(() => {
    if (view !== "exploded") return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!frameRef.current?.contains(event.target as Node)) dispatch({ type: "outsideTap" });
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "escape" });
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [view, frameRef, dispatch]);
}
