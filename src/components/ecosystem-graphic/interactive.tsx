"use client";

import { domAnimation, LazyMotion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { EcosystemSlug } from "@/content/ecosystem/registry";
import { HERO_TOGGLE_LABEL } from "@/content/home/hero-help";
import { HERO_SVG_ID } from "./constants";
import { ControlsRow, TOGGLE_CLASS } from "./controls-row";
import { EcosystemSvg } from "./ecosystem-svg";
import { HERO_CHUNK_MARKER } from "./hero-marker";
import { MotionPart, MotionTokensContext } from "./motion-part";
import { readMotionTokens } from "./motion-tokens";
import { useDismissals, useFocusEffect, useSwapLifecycle } from "./use-hero-effects";
import { useHeroHandlers } from "./use-hero-handlers";
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
  const handlers = useHeroHandlers({ state, dispatch, announce: setAnnouncement });
  useSwapLifecycle(frameRef, { onReady, swapped, restoreSlug });
  useFocusEffect(effect, frameRef, tokens.duration + tokens.stagger * 5);
  useDismissals(state.view, frameRef, dispatch);
  // The status text only means something while a touch tap has the layers separated; deriving it (not
  // clearing it in an effect) lets the same sentence be announced again after a collapse.
  const status = state.touchOpen ? announcement : "";

  return (
    <MotionTokensContext.Provider value={tokens}>
      <LazyMotion features={domAnimation} strict>
        <div
          ref={frameRef}
          data-hero-ready="true"
          data-hero-chunk={HERO_CHUNK_MARKER}
          onKeyDown={handlers.onKeyDown}
          onPointerDown={handlers.onPointerDown}
          onPointerCancel={handlers.onPointerCancel}
          onClick={handlers.onFrameClick}
        >
          <div
            className="eco-frame"
            onPointerEnter={handlers.onHover("pointerEnter")}
            onPointerLeave={handlers.onHover("pointerLeave")}
          >
            <EcosystemSvg
              Part={MotionPart}
              svgId={HERO_SVG_ID}
              layer="interactive"
              view={state.view}
              onClick={handlers.onLinkClick}
              onFocus={handlers.onFocus}
              onBlur={handlers.onBlur}
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
          <VisuallyHidden role="status">{status}</VisuallyHidden>
        </div>
      </LazyMotion>
    </MotionTokensContext.Provider>
  );
}
