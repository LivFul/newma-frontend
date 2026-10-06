import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { LeafIcon } from "@/components/brand/leaf-icon";
import {
  LEAF_PATH,
  LEAF_SHAPE_VIEWBOX,
  MARK_VIEWBOX,
  PILL_PATH,
  PILL_SHAPE_VIEWBOX,
} from "@/components/brand/mark-paths";
import { PillIcon } from "@/components/brand/pill-icon";

// The tight box of a path made only of absolute M/L/Z commands: "x y width height".
function boundsOf(path: string): string {
  const numbers = (path.match(/-?\d+\.?\d*/g) ?? []).map(Number);
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  const [x, y] = [Math.min(...xs), Math.min(...ys)];
  return `${x} ${y} ${Math.max(...xs) - x} ${Math.max(...ys) - y}`;
}

describe("brand icon viewBoxes", () => {
  // Value: protects=the tight viewBoxes are exactly the bounds of the leaf and pill paths, so a step marker can centre a number on the visible shape; fails_when=a path is redrawn without its tight box being updated, or the box is guessed; why_new=the icons only had the whole logo's box, which put each shape off to one side of its svg; seam=none
  it("crops each shape to its own bounds", () => {
    expect(LEAF_SHAPE_VIEWBOX).toBe(boundsOf(LEAF_PATH));
    expect(PILL_SHAPE_VIEWBOX).toBe(boundsOf(PILL_PATH));
  });

  // Value: protects=icons keep the whole-logo box unless asked to fit their shape, so existing uses beside each other and the logo spacing do not change; fails_when=the default flips to the shape box; why_new=a default change would silently move every leaf and pill on the site; seam=none
  it("keeps the logo box by default and crops only when asked", () => {
    const viewBox = (element: ReturnType<typeof createElement>) =>
      render(element).container.querySelector("svg")?.getAttribute("viewBox");
    expect(viewBox(createElement(LeafIcon))).toBe(MARK_VIEWBOX);
    expect(viewBox(createElement(PillIcon))).toBe(MARK_VIEWBOX);
    expect(viewBox(createElement(LeafIcon, { fit: "shape" }))).toBe(LEAF_SHAPE_VIEWBOX);
    expect(viewBox(createElement(PillIcon, { fit: "shape" }))).toBe(PILL_SHAPE_VIEWBOX);
  });
});
