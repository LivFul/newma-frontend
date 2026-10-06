"use client";

import {
  useRef,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { ecosystemHref } from "@/content/ecosystem/registry";
import { heroTouchAnnouncement } from "@/content/home/hero-help";
import { trackEvent } from "@/lib/analytics/events";
import type { HeroView } from "./part-props";
import { slugFrom } from "./slug-from";
import { heroReducer, type HeroEvent, type HeroState } from "./state";

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

// A touch that travels further than this between pointerdown and pointerup is a swipe or scroll, not a tap.
const TAP_SLOP_PX = 10;
// A click belongs to a gesture only if it follows its last pointer event this closely. Past it the
// one-shot flag below is stale (the gesture produced no click), so a later keyboard or assistive
// technology click is never swallowed.
const SWALLOW_WINDOW_MS = 400;

type HeroSlug = ReturnType<typeof slugFrom>;

type Options = {
  state: HeroState;
  dispatch: Dispatch<HeroEvent>;
  announce: (text: string) => void;
};

// Translates DOM events into HeroEvents and carries out the decisions the DOM must make itself: whether
// a click follows its link (the first touch tap only explodes the layers) and, for the second touch tap,
// navigating on pointerup.
export function useHeroHandlers({ state, dispatch, announce }: Options) {
  // Set by a touch pointerdown and consumed by the pointerup or click it produces. Any other end of that
  // gesture (cancel, a later click with no pointerdown such as assistive technology or the keyboard) must
  // leave it empty, so a stale gesture can never swallow a link activation.
  const pendingTouch = useRef<{ view: HeroView; slug: HeroSlug; x: number; y: number } | null>(
    null,
  );
  // One-shot: the next click belongs to a gesture already handled (a first tap that only exploded the
  // layers, a second tap that navigated on pointerup, or a drag past the tap slop), so it must neither
  // follow its link nor record a second component_open.
  const swallowClick = useRef(false);
  const swallowTimer = useRef<number | undefined>(undefined);
  const clearSwallow = () => {
    swallowClick.current = false;
    window.clearTimeout(swallowTimer.current);
  };
  // Swallow the click, with no expiry yet: used while the finger is still down, because a slow press
  // must not run the clock out before its click arrives. pointerup, pointercancel and the next
  // pointerdown settle it.
  const holdSwallow = () => {
    clearSwallow();
    swallowClick.current = true;
  };
  // Swallow the click that follows now, and stop swallowing if none comes.
  const armSwallow = () => {
    holdSwallow();
    swallowTimer.current = window.setTimeout(() => {
      swallowClick.current = false;
    }, SWALLOW_WINDOW_MS);
  };
  const resetGesture = () => {
    pendingTouch.current = null;
    clearSwallow();
  };

  const follow = (slug: NonNullable<HeroSlug>) => {
    trackEvent({ name: "component_open", slug });
    window.location.assign(ecosystemHref(slug));
  };

  const onPointerDown = (event: PointerEvent) => {
    resetGesture();
    if (event.pointerType !== "touch") return;
    const inSvg = Boolean((event.target as Element).closest?.("svg.eco-svg"));
    const slug = inSvg ? slugFrom(event.target) : null;
    pendingTouch.current = { view: state.view, slug, x: event.clientX, y: event.clientY };
    if (!inSvg) return;
    const tap: HeroEvent = { type: "tap", slug, touch: true, view: state.view };
    if (heroReducer(state, tap).effect.type === "preventNavigation") {
      // The first tap only explodes the layers.
      event.preventDefault();
      holdSwallow();
      if (slug) announce(heroTouchAnnouncement(slug));
      dispatch(tap);
    }
  };

  // The second tap navigates here, on pointerup, to the component the finger touched down on. Doing it
  // on pointerdown would also fire for a swipe that merely starts over a node.
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    // The click of a gesture that is already being swallowed follows this pointerup, not the pointerdown.
    if (swallowClick.current) armSwallow();
    const pending = pendingTouch.current;
    pendingTouch.current = null;
    if (!pending || pending.view !== "exploded" || !pending.slug) return;
    if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > TAP_SLOP_PX) {
      // A drag, not a tap, but the browser may still synthesize a click for it.
      armSwallow();
      return;
    }
    const tap: HeroEvent = { type: "tap", slug: pending.slug, touch: true, view: pending.view };
    if (heroReducer(state, tap).effect.type !== "navigate") return;
    dispatch(tap);
    armSwallow();
    follow(pending.slug);
  };

  const onLinkClick = (event: MouseEvent) => {
    if (swallowClick.current) {
      resetGesture();
      event.preventDefault();
      return;
    }
    const pending = pendingTouch.current;
    pendingTouch.current = null;
    const slug = slugFrom(event.target);
    const tap: HeroEvent = {
      type: "tap",
      slug,
      touch: pending !== null,
      view: pending?.view ?? state.view,
    };
    // A first touch tap only explodes the layers; the second tap follows the link.
    if (heroReducer(state, tap).effect.type === "preventNavigation") {
      event.preventDefault();
      if (slug) announce(heroTouchAnnouncement(slug));
    } else if (slug) {
      trackEvent({ name: "component_open", slug });
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

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: resetGesture,
    onFrameClick: resetGesture,
    onLinkClick,
    onKeyDown,
    onFocus,
    onBlur,
    onHover,
  };
}
