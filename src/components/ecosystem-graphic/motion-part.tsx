"use client";

import { m } from "motion/react";
import { createContext, useContext } from "react";
import type { PartGeometry } from "./geometry";
import { FALLBACK_MOTION, type HeroMotion } from "./motion-tokens";
import type { PartProps } from "./part-props";

export const MotionTokensContext = createContext<HeroMotion>(FALLBACK_MOTION);

// The only properties the explode animates: transform (x, y) and, through CSS driven by
// [data-view] on the svg, opacity. Nothing here touches layout.
export function partVariants(geometry: PartGeometry) {
  return {
    assembled: { x: geometry.assembled.x, y: geometry.assembled.y },
    exploded: { x: geometry.exploded.x, y: geometry.exploded.y },
  } as const;
}

export function MotionPart({ geometry, index, view, children }: PartProps) {
  const tokens = useContext(MotionTokensContext);
  return (
    <m.g
      className="eco-part"
      data-slug={geometry.slug}
      variants={partVariants(geometry)}
      initial={false}
      animate={view}
      transition={{
        duration: tokens.duration,
        ease: [...tokens.ease],
        delay: index * tokens.stagger,
      }}
    >
      {children}
    </m.g>
  );
}
