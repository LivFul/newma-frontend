import { useId } from "react";
import { PILL_PATH, PILL_SHAPE_VIEWBOX, MARK_VIEWBOX } from "./mark-paths";

type PillIconProps = {
  className?: string;
  title?: string;
  gradient?: boolean;
  /** `mark` keeps the whole logo's box (shapes sit where they do in the logo); `shape` crops to this shape. */
  fit?: "mark" | "shape";
};

export function PillIcon({
  className = "size-5",
  title,
  gradient = true,
  fit = "mark",
}: PillIconProps) {
  const raw = useId();
  const id = `pill-${raw.replace(/:/g, "")}`;
  return (
    <svg
      viewBox={fit === "shape" ? PILL_SHAPE_VIEWBOX : MARK_VIEWBOX}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {gradient ? (
        <defs>
          <linearGradient
            id={id}
            x1="403"
            y1="124"
            x2="733"
            y2="124"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0b404d" />
            <stop offset="1" stopColor="#1b8896" />
          </linearGradient>
        </defs>
      ) : null}
      <path fill={gradient ? `url(#${id})` : "currentColor"} d={PILL_PATH} />
    </svg>
  );
}
