import { useId } from "react";

// The NEWMA pill icon (brand pack v1.0, 02_icon): a 2:1 capsule rotated 45° and split by a seam, the
// plant half lower left and the pill half upper right. Drawn from arcs at radius 10 rather than the
// pack's 7 KB polyline; the seam is the pack's measured 0.233r gap.
export const CAPSULE_VIEWBOX = "-17.07 -17.07 34.14 34.14";
export const CAPSULE_PLANT_PATH = "M-1.17-10H-10a10 10 0 0 0 0 20h8.83z";
export const CAPSULE_PILL_PATH = "M1.17-10H10a10 10 0 0 1 0 20H1.17z";

/** `color` for light grounds, `reversed` for Night and Deep Teal grounds, `mono` follows currentColor. */
export type CapsuleTone = "color" | "reversed" | "mono";

const STOPS: Record<
  Exclude<CapsuleTone, "mono">,
  { plant: [string, string]; pill: [string, string] }
> = {
  // Brand guide v1: Sage for the plant half, Lavender for the pill half (leaf-bright → leaf,
  // capsule-deep → capsule tokens).
  color: { plant: ["#9ba77d", "#5d7350"], pill: ["#5f5986", "#86809c"] },
  reversed: { plant: ["#c9d0b3", "#9ba77d"], pill: ["#86809c", "#c4bedb"] },
};

// Each half's gradient runs along the capsule's own axis: the plant half tip to seam, the pill half
// seam to tip.
const HALVES = [
  { half: "plant", x1: -20, x2: -1 },
  { half: "pill", x1: 1, x2: 20 },
] as const;

type CapsuleIconProps = {
  className?: string;
  title?: string;
  tone?: CapsuleTone;
};

export function CapsuleIcon({ className = "size-5", title, tone = "color" }: CapsuleIconProps) {
  const raw = useId();
  const id = `capsule-${raw.replace(/:/g, "")}`;
  const stops = tone === "mono" ? null : STOPS[tone];
  return (
    <svg
      viewBox={CAPSULE_VIEWBOX}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {stops ? (
        <defs>
          {HALVES.map(({ half, x1, x2 }) => (
            <linearGradient
              key={half}
              id={`${id}-${half}`}
              x1={x1}
              x2={x2}
              y1="0"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={stops[half][0]} />
              <stop offset="1" stopColor={stops[half][1]} />
            </linearGradient>
          ))}
        </defs>
      ) : null}
      <g transform="rotate(-45)" fill="currentColor">
        <path d={CAPSULE_PLANT_PATH} fill={stops ? `url(#${id}-plant)` : undefined} />
        <path d={CAPSULE_PILL_PATH} fill={stops ? `url(#${id}-pill)` : undefined} />
      </g>
    </svg>
  );
}
