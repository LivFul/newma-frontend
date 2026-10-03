import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCssVars } from "@/lib/a11y/contrast";
import {
  FALLBACK_MOTION,
  parseCubicBezier,
  parseDuration,
  readMotionTokens,
} from "@/components/ecosystem-graphic/motion-tokens";

const motionCss = readFileSync(
  path.resolve(__dirname, "../../../src/styles/tokens/motion.css"),
  "utf8",
);
const vars = parseCssVars(motionCss.split("@media")[0]!);

describe("motion tokens for the hero", () => {
  it("fallback constants equal src/styles/tokens/motion.css", () => {
    expect(FALLBACK_MOTION.duration).toBe(parseDuration(vars["--motion-duration-slow"]!));
    expect(FALLBACK_MOTION.ease).toEqual(parseCubicBezier(vars["--motion-ease-emphasized"]!));
  });
  it("stagger sits inside the 0.05 to 0.10 s rule", () => {
    expect(FALLBACK_MOTION.stagger).toBeGreaterThanOrEqual(0.05);
    expect(FALLBACK_MOTION.stagger).toBeLessThanOrEqual(0.1);
  });
  it("parses milliseconds, seconds and rejects garbage", () => {
    expect(parseDuration("450ms")).toBe(0.45);
    expect(parseDuration(" 0.2s ")).toBe(0.2);
    expect(parseDuration("fast")).toBeNull();
    expect(parseCubicBezier("cubic-bezier(0.3, 0, 0, 1)")).toEqual([0.3, 0, 0, 1]);
    expect(parseCubicBezier("ease")).toBeNull();
  });
  it("reads the live CSS variables once and falls back when they are missing", () => {
    const root = document.createElement("div");
    root.style.setProperty("--motion-duration-slow", "300ms");
    root.style.setProperty("--motion-ease-emphasized", "cubic-bezier(0.1, 0.2, 0.3, 0.4)");
    document.body.append(root);
    expect(readMotionTokens(root)).toMatchObject({ duration: 0.3, ease: [0.1, 0.2, 0.3, 0.4] });
    const bare = document.createElement("div");
    document.body.append(bare);
    expect(readMotionTokens(bare)).toEqual(FALLBACK_MOTION);
  });
});
