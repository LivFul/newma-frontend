import type { CSSProperties } from "react";
import type { PartProps } from "./part-props";

// Server-rendered wrapper: positions come from CSS custom properties so the diagram works without
// JavaScript (hover and focus explode it, and prefers-reduced-motion forces the exploded layout).
export function StaticPart({ geometry, index, children }: PartProps) {
  const style = {
    "--ax": `${geometry.assembled.x}px`,
    "--ay": `${geometry.assembled.y}px`,
    "--ex": `${geometry.exploded.x}px`,
    "--ey": `${geometry.exploded.y}px`,
    "--i": index,
    "--eco-depth": geometry.depth,
  } as CSSProperties;
  return (
    <g className="eco-part" data-slug={geometry.slug} data-depth={geometry.depth} style={style}>
      {children}
    </g>
  );
}
