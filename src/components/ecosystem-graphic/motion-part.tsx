"use client";

import { m } from "motion/react";
import { createContext, useContext, useMemo } from "react";
import { PARTS, type PartGeometry } from "./geometry";
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

// Built once per part: the geometry is frozen module data.
const VARIANTS = new Map(PARTS.map((part) => [part.slug, partVariants(part)]));

export function MotionPart({ geometry, index, view, children }: PartProps) {
  const tokens = useContext(MotionTokensContext);
  const transition = useMemo(() => {
    const [x1, y1, x2, y2] = tokens.ease;
    const ease: [number, number, number, number] = [x1, y1, x2, y2];
    return { duration: tokens.duration, ease, delay: index * tokens.stagger };
  }, [tokens, index]);
  return (
    <m.g
      className="eco-part"
      data-slug={geometry.slug}
      variants={VARIANTS.get(geometry.slug)}
      initial={false}
      animate={view}
      transition={transition}
    >
      {children}
    </m.g>
  );
}
