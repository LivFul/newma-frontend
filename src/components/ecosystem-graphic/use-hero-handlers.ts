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

type Options = {
  state: HeroState;
  dispatch: Dispatch<HeroEvent>;
  announce: (text: string) => void;
};

// Translates DOM events into HeroEvents and carries out the one decision the DOM must make itself:
// whether a click follows its link (touch first-tap interception).
export function useHeroHandlers({ state, dispatch, announce }: Options) {
  // Set by a touch pointerdown and consumed by the click it produces. Any other end of that gesture
  // (cancel, a later click with no pointerdown such as assistive technology or the keyboard) must
  // leave it empty, so a stale flag can never swallow a link activation.
  const pendingTouch = useRef<{ view: HeroView; slug: ReturnType<typeof slugFrom> } | null>(null);
  const lastTouchSlug = useRef<ReturnType<typeof slugFrom>>(null);
  const absorbedTap = useRef(false);
  const clearPending = () => {
    pendingTouch.current = null;
  };

  const follow = (slug: NonNullable<ReturnType<typeof slugFrom>>, target: EventTarget | null) => {
    trackEvent({ name: "component_open", slug });
    const link =
      (target as Element | null)?.closest?.("[data-slug]")?.querySelector("a") ??
      (target as Element | null)?.closest?.("a");
    const href = link instanceof HTMLAnchorElement ? link.href : ecosystemHref(slug);
    window.location.assign(href);
  };

  const onPointerDown = (event: PointerEvent) => {
    // A leftover absorb flag from a click-less first tap must not swallow the next gesture.
    absorbedTap.current = false;
    if (event.pointerType !== "touch") {
      pendingTouch.current = null;
      return;
    }
    const inSvg = Boolean((event.target as Element).closest?.("svg.eco-svg"));
    const slug = inSvg ? slugFrom(event.target) : null;
    if (slug) lastTouchSlug.current = slug;
    pendingTouch.current = { view: state.view, slug };
    if (!inSvg) return;
    const tap: HeroEvent = { type: "tap", slug, touch: true, view: state.view };
    const effect = heroReducer(state, tap).effect;
    if (effect.type === "preventNavigation") {
      event.preventDefault();
      absorbedTap.current = true;
      if (slug) announce(heroTouchAnnouncement(slug));
      dispatch(tap);
    } else if (state.view === "exploded") {
      const go = slug ?? lastTouchSlug.current;
      if (!go) return;
      event.preventDefault();
      dispatch({ type: "tap", slug: go, touch: true, view: "exploded" });
      follow(go, event.target);
      clearPending();
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    const pending = pendingTouch.current;
    if (!pending || pending.view !== "exploded") return;
    const slug = slugFrom(event.target) ?? pending.slug ?? lastTouchSlug.current;
    if (!slug) return;
    const tap: HeroEvent = { type: "tap", slug, touch: true, view: pending.view };
    if (heroReducer(state, tap).effect.type !== "navigate") return;
    dispatch(tap);
    follow(slug, event.target);
    clearPending();
  };

  const onLinkClick = (event: MouseEvent) => {
    if (absorbedTap.current) {
      absorbedTap.current = false;
      event.preventDefault();
      clearPending();
      return;
    }
    const pending = pendingTouch.current;
    clearPending();
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
    onPointerCancel: () => {
      absorbedTap.current = false;
      pendingTouch.current = null;
    },
    onFrameClick: clearPending,
    onLinkClick,
    onKeyDown,
    onFocus,
    onBlur,
    onHover,
  };
}
