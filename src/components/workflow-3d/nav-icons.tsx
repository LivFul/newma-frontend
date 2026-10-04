import type { NavCommand } from "./stage";

export type NavIconName = NavCommand | "reset";

// Strokes on a 24-unit box. Pan is a plain chevron; tilt is an arrow against a horizon line, so
// it reads as pitching the view rather than sliding it.
const PATHS: Record<NavIconName, readonly string[]> = {
  "pan-up": ["m6 15 6-6 6 6"],
  "pan-down": ["m6 9 6 6 6-6"],
  "pan-left": ["m15 18-6-6 6-6"],
  "pan-right": ["m9 18 6-6-6-6"],
  "tilt-up": ["M4 20h16", "M12 16V5", "m7 10 5-5 5 5"],
  "tilt-down": ["M4 4h16", "M12 8v11", "m7 14 5 5 5-5"],
  "zoom-in": ["M12 5v14", "M5 12h14"],
  "zoom-out": ["M5 12h14"],
  reset: ["m3 11 9-7.5 9 7.5", "M5.5 9.5V20h13V9.5", "M10 20v-5h4v5"],
};

/** Decorative: every pad button already carries its name as an aria-label. */
export function NavIcon({ name }: { readonly name: NavIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
