"use client";

import { LazyMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { ecosystemHref, isEcosystemSlug, type EcosystemSlug } from "@/content/ecosystem/registry";
import { HERO_HINT_INTERACTIVE, HERO_TOGGLE_LABEL } from "@/content/home/hero-help";
import { HERO_SVG_ID } from "./constants";
import { EcosystemSvg } from "./ecosystem-svg";
import { HERO_CHUNK_MARKER } from "./hero-marker";
import { MotionPart, MotionTokensContext } from "./motion-part";
import { readMotionTokens } from "./motion-tokens";
import type { HeroView } from "./part-props";
import { heroReducer, INITIAL_HERO_STATE, type HeroEffect, type HeroEvent } from "./state";

export type InteractiveProps = {
  /** Called from a layout effect on first commit, so the loader can drop the static layer pre-paint. */
  onReady: () => void;
  /** True once the loader has removed the static layer; focus is restored then. */
  swapped: boolean;
  /** Slug that held focus in the static layer, if any. */
  initialFocus: EcosystemSlug | null;
};

const loadFeatures = () => import("./motion-features").then((module) => module.default);

const KEY_EVENTS: Readonly<Record<string, HeroEvent>> = {
  ArrowRight: { type: "arrow", direction: "next" },
  ArrowDown: { type: "arrow", direction: "next" },
  ArrowLeft: { type: "arrow", direction: "prev" },
  ArrowUp: { type: "arrow", direction: "prev" },
  Home: { type: "home" },
  End: { type: "end" },
  Escape: { type: "escape" },
};

const slugOf = (target: EventTarget | null): EcosystemSlug | null => {
  const slug = (target as Element | null)?.closest?.("[data-slug]")?.getAttribute("data-slug");
  return slug && isEcosystemSlug(slug) ? slug : null;
};

export default function Interactive({ onReady, swapped, initialFocus }: InteractiveProps) {
  const [tokens] = useState(() => readMotionTokens());
  const [{ state, effect }, dispatch] = useReducer(
    (previous: ReturnType<typeof heroReducer>, event: HeroEvent) =>
      heroReducer(previous.state, event),
    { state: INITIAL_HERO_STATE, effect: { type: "none" } as HeroEffect },
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<string>("");
  const viewAtPointerDown = useRef<HeroView>("assembled");

  useLayoutEffect(onReady, [onReady]);

  useLayoutEffect(() => {
    if (!swapped || !initialFocus) return;
    link(frameRef.current, initialFocus)?.focus();
  }, [swapped, initialFocus]);

  // Moving focus is the one effect the reducer asks for; focusing fires the focusIn event itself.
  useEffect(() => {
    if (effect.type === "focus") link(frameRef.current, effect.slug)?.focus();
  }, [effect]);

  useEffect(() => {
    if (state.view !== "exploded") return;
    const onDocumentPointerDown = (event: globalThis.PointerEvent) => {
      if (!frameRef.current?.contains(event.target as Node)) dispatch({ type: "outsideTap" });
    };
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown);
  }, [state.view]);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      lastPointer.current = event.pointerType;
      viewAtPointerDown.current = state.view;
    },
    [state.view],
  );
  const onClick = (event: MouseEvent) => {
    const tap: HeroEvent = {
      type: "tap",
      slug: slugOf(event.target),
      touch: lastPointer.current === "touch",
      view: viewAtPointerDown.current,
    };
    // A first touch tap only explodes the layers; the second tap follows the link.
    if (heroReducer(state, tap).effect.type === "preventNavigation") event.preventDefault();
    dispatch(tap);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    lastPointer.current = "keyboard";
    const keyEvent = KEY_EVENTS[event.key];
    const inSvg = (event.target as Element).closest("svg") !== null;
    if (!keyEvent || event.altKey || event.ctrlKey || event.metaKey) return;
    if (keyEvent.type !== "escape" && !inSvg) return;
    if (keyEvent.type === "escape" && state.view === "assembled") return;
    event.preventDefault();
    dispatch(keyEvent);
  };
  const onFocus = (event: FocusEvent) => {
    const slug = slugOf(event.target);
    if (slug) dispatch({ type: "focusIn", slug });
  };
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next) || slugOf(next) === null) {
      dispatch({ type: "focusOut" });
    }
  };
  const onMouse = (type: "pointerEnter" | "pointerLeave") => (event: PointerEvent) => {
    if (event.pointerType === "mouse") dispatch({ type });
  };

  return (
    <MotionTokensContext.Provider value={tokens}>
      <LazyMotion features={loadFeatures} strict>
        <div
          ref={frameRef}
          data-hero-ready="true"
          data-hero-chunk={HERO_CHUNK_MARKER}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
        >
          <div
            className="eco-frame"
            onPointerEnter={onMouse("pointerEnter")}
            onPointerLeave={onMouse("pointerLeave")}
          >
            <EcosystemSvg
              Part={MotionPart}
              svgId={HERO_SVG_ID}
              layer="interactive"
              view={state.view}
              onClick={onClick}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="eco-controls mx-auto flex min-h-11 max-w-[34rem] items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 min-w-11 shrink-0"
              aria-pressed={state.pinned}
              aria-controls={HERO_SVG_ID}
              onClick={() => dispatch({ type: "toggle" })}
            >
              {HERO_TOGGLE_LABEL.text}
            </Button>
            <p className="text-sm text-fg-muted">{HERO_HINT_INTERACTIVE.text}</p>
          </div>
        </div>
      </LazyMotion>
    </MotionTokensContext.Provider>
  );
}

function link(root: HTMLElement | null, slug: EcosystemSlug): HTMLAnchorElement | null {
  return root?.querySelector<HTMLAnchorElement>(`a[href="${ecosystemHref(slug)}"]`) ?? null;
}
