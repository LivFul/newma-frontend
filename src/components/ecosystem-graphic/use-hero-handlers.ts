"use client";

import {
  useRef,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { trackEvent } from "@/lib/analytics/events";
import { heroTouchAnnouncement } from "@/content/home/hero-help";
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
  const pendingTouch = useRef<{ view: HeroView } | null>(null);
  const clearPending = () => {
    pendingTouch.current = null;
  };

  const onPointerDown = (event: PointerEvent) => {
    pendingTouch.current = event.pointerType === "touch" ? { view: state.view } : null;
  };

  const onLinkClick = (event: MouseEvent) => {
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
    onPointerCancel: clearPending,
    onFrameClick: clearPending,
    onLinkClick,
    onKeyDown,
    onFocus,
    onBlur,
    onHover,
  };
}
