import { useId } from "react";
import { LEAF_PATH, LEAF_SHAPE_VIEWBOX, MARK_VIEWBOX } from "./mark-paths";

type LeafIconProps = {
  className?: string;
  title?: string;
  gradient?: boolean;
  /** `mark` keeps the whole logo's box (shapes sit where they do in the logo); `shape` crops to this shape. */
  fit?: "mark" | "shape";
};

export function LeafIcon({
  className = "size-5",
  title,
  gradient = true,
  fit = "mark",
}: LeafIconProps) {
  const raw = useId();
  const id = `leaf-${raw.replace(/:/g, "")}`;
  return (
    <svg
      viewBox={fit === "shape" ? LEAF_SHAPE_VIEWBOX : MARK_VIEWBOX}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {gradient ? (
        <defs>
          <linearGradient id={id} x1="30" y1="124" x2="379" y2="124" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b3e570" />
            <stop offset="1" stopColor="#15a676" />
          </linearGradient>
        </defs>
      ) : null}
      <path fill={gradient ? `url(#${id})` : "currentColor"} fillRule="evenodd" d={LEAF_PATH} />
    </svg>
  );
}
