import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EcosystemSvg } from "@/components/ecosystem-graphic/ecosystem-svg";
import Interactive from "@/components/ecosystem-graphic/interactive";
import { MotionPart, partVariants } from "@/components/ecosystem-graphic/motion-part";
import { PARTS } from "@/components/ecosystem-graphic/geometry";
import { StaticPart } from "@/components/ecosystem-graphic/static-part";
import { ECOSYSTEM_SLUGS, HERO_LABELS } from "@/content/ecosystem/registry";
import { expectNoAxeViolations } from "../ui/axe";

function mount(overrides: Partial<Parameters<typeof Interactive>[0]> = {}) {
  const onReady = vi.fn();
  const utils = render(
    <Interactive onReady={onReady} swapped={false} initialFocus={null} {...overrides} />,
  );
  const svg = utils.container.querySelector("svg") as SVGSVGElement;
  const links = Array.from(svg.querySelectorAll<HTMLAnchorElement>("a[href]"));
  return { ...utils, onReady, svg, links };
}

const structure = (root: Element) =>
  Array.from(root.querySelectorAll("g[data-slug]")).map((g) => ({
    slug: g.getAttribute("data-slug"),
    href: g.querySelector("a")?.getAttribute("href"),
    label: g.querySelector("a")?.getAttribute("aria-label"),
    text: Array.from(g.querySelectorAll("text")).map((t) => t.textContent),
  }));

describe("Interactive hero layer", () => {
  it("renders the same six links, labels and text as the static layer", () => {
    const stat = render(<EcosystemSvg Part={StaticPart} svgId="eco-hero" />);
    const expected = structure(stat.container);
    stat.unmount();
    const { container } = mount();
    expect(structure(container)).toEqual(expected);
    expect(expected).toHaveLength(6);
  });

  it("reports ready from the first commit and exposes the stable hook", () => {
    const { onReady, container } = mount();
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-hero-ready="true"]')).not.toBeNull();
  });

  it("has a 44 px Explore components toggle with aria-pressed and a constant name", async () => {
    const user = userEvent.setup();
    const { svg } = mount();
    const toggle = screen.getByRole("button", { name: "Explore components" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-controls", svg.id);
    expect(toggle.className).toMatch(/min-h-11/);
    expect(toggle.className).toMatch(/min-w-11/);
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Explore components" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(svg).toHaveAttribute("data-view", "exploded");
  });

  it("explodes on focus and collapses on Escape while keeping focus", async () => {
    const user = userEvent.setup();
    const { svg, links } = mount();
    await user.tab();
    expect(links[0]).toHaveFocus();
    expect(svg).toHaveAttribute("data-view", "exploded");
    await user.keyboard("{Escape}");
    expect(svg).toHaveAttribute("data-view", "assembled");
    expect(links[0]).toHaveFocus();
  });

  it("moves DOM focus with arrow keys, Home and End without wrapping", async () => {
    const user = userEvent.setup();
    const { links } = mount();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(links[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(links[5]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(links[5]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(links[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(links[0]).toHaveFocus();
  });

  it("prevents default on arrows inside the graphic only", () => {
    const { links } = mount();
    links[0]!.focus();
    const inside = fireEvent.keyDown(links[0]!, { key: "ArrowDown" });
    expect(inside).toBe(false);
    const toggle = screen.getByRole("button", { name: "Explore components" });
    expect(fireEvent.keyDown(toggle, { key: "ArrowDown" })).toBe(true);
  });

  it("does not wipe focus state when focus moves between components", async () => {
    const user = userEvent.setup();
    const { svg } = mount();
    await user.tab();
    await user.tab();
    expect(svg).toHaveAttribute("data-view", "exploded");
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(svg).toHaveAttribute("data-view", "assembled");
  });

  it("intercepts only the first touch tap", () => {
    const { links, svg } = mount();
    const link = links[1]!;
    const tap = () => {
      fireEvent.pointerDown(link, { pointerType: "touch" });
      return fireEvent.click(link);
    };
    expect(tap()).toBe(false); // default prevented: no navigation
    expect(svg).toHaveAttribute("data-view", "exploded");
    expect(tap()).toBe(true); // second tap follows the link
  });

  it("never intercepts mouse clicks", () => {
    const { links } = mount();
    fireEvent.pointerDown(links[0]!, { pointerType: "mouse" });
    expect(fireEvent.click(links[0]!)).toBe(true);
  });

  it("a pointerdown outside collapses a touch-opened view", () => {
    const { links, svg } = mount();
    fireEvent.pointerDown(links[0]!, { pointerType: "touch" });
    fireEvent.click(links[0]!);
    expect(svg).toHaveAttribute("data-view", "exploded");
    act(() => {
      fireEvent.pointerDown(document.body, { pointerType: "touch" });
    });
    expect(svg).toHaveAttribute("data-view", "assembled");
  });

  it("restores focus to the slug that had it before the swap", () => {
    const { links, rerender, onReady } = mount();
    rerender(<Interactive onReady={onReady} swapped initialFocus={ECOSYSTEM_SLUGS[3]} />);
    expect(links[3]).toHaveFocus();
  });

  it("animates only x and y (opacity follows data-view in CSS)", () => {
    for (const geometry of PARTS) {
      const variants = partVariants(geometry);
      const keys = new Set(Object.values(variants).flatMap((v) => Object.keys(v)));
      expect([...keys].sort()).toEqual(["x", "y"]);
      expect(variants.exploded).toEqual({ x: geometry.exploded.x, y: geometry.exploded.y });
    }
    expect(MotionPart).toBeTypeOf("function");
  });

  it("names every link with the same accessible name as the static layer", () => {
    const { links } = mount();
    expect(links.map((a) => a.getAttribute("aria-label")?.split(".")[0])).toEqual(
      ECOSYSTEM_SLUGS.map((s) => HERO_LABELS[s].title),
    );
  });

  it("is axe clean", async () => {
    const { container } = mount();
    await expectNoAxeViolations(container);
  });
});
