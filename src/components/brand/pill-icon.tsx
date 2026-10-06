import { useId } from "react";
import { MARK_VIEWBOX, PILL_PATH } from "./mark-paths";

type PillIconProps = {
  className?: string;
  title?: string;
  gradient?: boolean;
};

export function PillIcon({ className = "size-5", title, gradient = true }: PillIconProps) {
  const raw = useId();
  const id = `pill-${raw.replace(/:/g, "")}`;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
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
