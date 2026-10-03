"use client";

import { domAnimation, LazyMotion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import { trackEvent } from "@/lib/analytics/events";
import { HERO_TOGGLE_LABEL, heroTouchAnnouncement } from "@/content/home/hero-help";
import { HERO_SVG_ID } from "./constants";
import { ControlsRow, TOGGLE_CLASS } from "./controls-row";
import { EcosystemSvg } from "./ecosystem-svg";
import { HERO_CHUNK_MARKER } from "./hero-marker";
import { MotionPart, MotionTokensContext } from "./motion-part";
import { readMotionTokens } from "./motion-tokens";
import type { HeroView } from "./part-props";
import { slugFrom } from "./slug-from";
import { heroReducer, type HeroEvent } from "./state";
import { useHeroState } from "./use-hero-state";

export type InteractiveProps = {
  /** Called from a layout effect on first commit, so the loader can drop the static layer pre-paint. */
  onReady: () => void;
  /** True once the loader has removed the static layer; focus is restored then. */
  swapped: boolean;
  /** Slug that held focus in the static layer, if any (also seeds the view). */
  initialFocus: EcosystemSlug | null;
  /** A mouse or pen pointer was over the static layer when the swap started. */
  initialHovering?: boolean;
};

const KEY_EVENTS: Readonly<Record<string, HeroEvent>> = {
  ArrowRight: { type: "arrow", direction: "next" },
  ArrowDown: { type: "arrow", direction: "next" },
  ArrowLeft: { type: "arrow", direction: "prev" },
  ArrowUp: { type: "arrow", direction: "prev" },
  Home: { type: "home" },
  End: { type: "end" },
};

// Anything except touch can hover (mouse, pen); touch gets the tap-to-explode path.
const canHover = (event: PointerEvent) => event.pointerType !== "touch";

function link(root: HTMLElement | null, slug: EcosystemSlug): HTMLAnchorElement | null {
  return root?.querySelector<HTMLAnchorElement>(`[data-slug="${slug}"] > a`) ?? null;
}

export default function Interactive({
  onReady,
  swapped,
  initialFocus,
  initialHovering = false,
}: InteractiveProps) {
  const [tokens] = useState(() => readMotionTokens());
  const [restoreSlug] = useState(initialFocus);
  const { state, effect, dispatch } = useHeroState({
    hovering: initialHovering,
    active: initialFocus,
  });
  const [announcement, setAnnouncement] = useState("");
  const frameRef = useRef<HTMLDivElement>(null);
  // Set by a touch pointerdown and consumed by the click it produces. A click with no pointerdown
  // (assistive technology, element.click(), keyboard) is never treated as a touch tap.
  const pendingTouch = useRef<{ view: HeroView } | null>(null);

  useLayoutEffect(() => {
    onReady();
  }, [onReady]);

  useLayoutEffect(() => {
    if (swapped && restoreSlug) link(frameRef.current, restoreSlug)?.focus();
  }, [swapped, restoreSlug]);

  useFocusEffect(effect, frameRef, tokens.duration + tokens.stagger * 5);
  useDismissals(state.view, frameRef, dispatch);

  const onPointerDown = (event: PointerEvent) => {
    pendingTouch.current = event.pointerType === "touch" ? { view: state.view } : null;
  };
  const onLinkClick = (event: MouseEvent) => {
    const pending = pendingTouch.current;
    pendingTouch.current = null;
    const tap: HeroEvent = {
      type: "tap",
      slug: slugFrom(event.target),
      touch: pending !== null,
      view: pending?.view ?? state.view,
    };
    const { effect: tapEffect } = heroReducer(state, tap);
    if (tapEffect.type === "preventNavigation") {
      event.preventDefault();
      if (tap.type === "tap" && tap.slug) setAnnouncement(heroTouchAnnouncement(tap.slug));
    } else if (tap.type === "tap" && tap.slug) {
      trackEvent({ name: "component_open", slug: tap.slug });
    }
    dispatch(tap);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const keyEvent = KEY_EVENTS[event.key];
    if (!keyEvent || event.altKey || event.ctrlKey || event.metaKey) return;
    if ((event.target as Element).closest("svg") === null) return;
    // Only swallow the key when focus actually moves, so the ends of the list do not trap scrolling.
    if (heroReducer(state, keyEvent).effect.type === "focus") event.preventDefault();
    dispatch(keyEvent);
  };
  const onFocus = (event: FocusEvent) => {
    const slug = slugFrom(event.target);
    if (slug) dispatch({ type: "focusIn", slug });
  };
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (!next || slugFrom(next) === null) dispatch({ type: "focusOut" });
  };
  const onHover = (type: "pointerEnter" | "pointerLeave") => (event: PointerEvent) => {
    if (canHover(event)) dispatch({ type });
  };

  return (
    <MotionTokensContext.Provider value={tokens}>
      <LazyMotion features={domAnimation} strict>
        <div
          ref={frameRef}
          data-hero-ready="true"
          data-hero-chunk={HERO_CHUNK_MARKER}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onClick={() => {
            pendingTouch.current = null;
          }}
        >
          <div
            className="eco-frame"
            onPointerEnter={onHover("pointerEnter")}
            onPointerLeave={onHover("pointerLeave")}
          >
            <EcosystemSvg
              Part={MotionPart}
              svgId={HERO_SVG_ID}
              layer="interactive"
              view={state.view}
              onClick={onLinkClick}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <ControlsRow>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={TOGGLE_CLASS}
              aria-pressed={state.pinned || state.touchOpen}
              aria-controls={HERO_SVG_ID}
              onClick={() => dispatch({ type: "toggle" })}
            >
              {HERO_TOGGLE_LABEL.text}
            </Button>
          </ControlsRow>
          <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        </div>
      </LazyMotion>
    </MotionTokensContext.Provider>
  );
}

// Moving focus is the one effect the reducer asks for. Focus without scrolling, then bring the link
// into view once the explode has settled, because the browser would otherwise scroll to the
// pre-explosion position.
function useFocusEffect(
  effect: ReturnType<typeof useHeroState>["effect"],
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
function useDismissals(
  view: HeroView,
  frameRef: RefObject<HTMLDivElement | null>,
  dispatch: ReturnType<typeof useHeroState>["dispatch"],
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
