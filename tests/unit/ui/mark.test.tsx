// Value: protects=every status Mark kind draws a shape and stays decorative (aria-hidden, unfocusable); fails_when=a kind lacks a shape case or loses aria-hidden; why_new=new SVG replaces text glyphs; seam=none
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Mark, type MarkKind } from "@/components/ui/mark";
import { expectNoAxeViolations } from "./axe";

// A Record keyed by MarkKind makes this list fail type-checking when a kind is added without a case here.
const KINDS: Readonly<Record<MarkKind, true>> = {
  check: true,
  cross: true,
  dot: true,
  ring: true,
  half: true,
  pause: true,
  triangle: true,
  clock: true,
  alert: true,
  square: true,
  "square-open": true,
  arrow: true,
};

describe("Mark", () => {
  it.each(Object.keys(KINDS) as MarkKind[])("draws a decorative %s mark", (kind) => {
    const { container } = render(<Mark kind={kind} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.querySelectorAll("path, circle, rect").length).toBeGreaterThan(0);
  });

  it("gives each kind a distinct drawing, so statuses stay distinguishable by shape", () => {
    const drawings = (Object.keys(KINDS) as MarkKind[]).map(
      (kind) => render(<Mark kind={kind} />).container.querySelector("svg")!.innerHTML,
    );
    expect(new Set(drawings).size).toBe(drawings.length);
  });

  it("adds no accessible name or violation next to status text", async () => {
    const { container } = render(
      <p>
        <Mark kind="check" className="size-4" /> Done
      </p>,
    );
    expect(container.querySelector("svg")).toHaveClass("size-4");
    await expectNoAxeViolations(container);
  });
});
