// The explode reads its duration and easing from the motion tokens once (never inline literals).
// The fallback constants mirror src/styles/tokens/motion.css and are pinned by a unit test.
export type HeroMotion = Readonly<{
  duration: number;
  ease: readonly [number, number, number, number];
  stagger: number;
}>;

export const FALLBACK_MOTION: HeroMotion = Object.freeze({
  duration: 0.6,
  ease: Object.freeze([0.22, 1, 0.36, 1] as const),
  // Between plates, inside the 0.05 to 0.10 s rule.
  stagger: 0.06,
});

export function parseDuration(value: string): number | null {
  const match = /^\s*(\d*\.?\d+)(ms|s)\s*$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === "ms" ? amount / 1000 : amount;
}

export function parseCubicBezier(value: string): [number, number, number, number] | null {
  const match = /^\s*cubic-bezier\(([^)]+)\)\s*$/.exec(value);
  if (!match) return null;
  const parts = match[1]!.split(",").map((part) => Number(part.trim()));
  return parts.length === 4 && parts.every(Number.isFinite)
    ? [parts[0]!, parts[1]!, parts[2]!, parts[3]!]
    : null;
}

export function readMotionTokens(root: Element = document.documentElement): HeroMotion {
  const style = getComputedStyle(root);
  const duration = parseDuration(style.getPropertyValue("--motion-duration-slow"));
  const ease = parseCubicBezier(style.getPropertyValue("--motion-ease-emphasized"));
  return Object.freeze({
    duration: duration ?? FALLBACK_MOTION.duration,
    ease: ease ?? FALLBACK_MOTION.ease,
    stagger: FALLBACK_MOTION.stagger,
  });
}
