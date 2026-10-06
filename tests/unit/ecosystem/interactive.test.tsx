import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EcosystemSvg } from "@/components/ecosystem-graphic/ecosystem-svg";
import Interactive from "@/components/ecosystem-graphic/interactive";
import { MotionPart, partVariants } from "@/components/ecosystem-graphic/motion-part";
import { PARTS } from "@/components/ecosystem-graphic/geometry";
import { HeroStatic } from "@/components/ecosystem-graphic/hero-static";
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

  it("prevents default on arrows only when focus really moves inside the graphic", () => {
    const { links } = mount();
    act(() => links[0]!.focus());
    expect(fireEvent.keyDown(links[0]!, { key: "ArrowDown" })).toBe(false);
    expect(links[1]).toHaveFocus();
    // At the end of the list nothing moves, so the key is left to the page (no scroll trap).
    act(() => links[5]!.focus());
    expect(fireEvent.keyDown(links[5]!, { key: "ArrowDown" })).toBe(true);
    const toggle = screen.getByRole("button", { name: "Explore components" });
    expect(fireEvent.keyDown(toggle, { key: "ArrowDown" })).toBe(true);
  });

  it("starts exploded when hover or focus was present at the swap", () => {
    const hovered = mount({ initialHovering: true });
    expect(hovered.svg).toHaveAttribute("data-view", "exploded");
    hovered.unmount();
    const focused = mount({ initialFocus: ECOSYSTEM_SLUGS[2] });
    expect(focused.svg).toHaveAttribute("data-view", "exploded");
  });

  it("treats a pen like a hover device and a touch pointer like a tap device", () => {
    const { svg } = mount();
    const frame = svg.parentElement!;
    fireEvent.pointerEnter(frame, { pointerType: "pen" });
    expect(svg).toHaveAttribute("data-view", "exploded");
    fireEvent.pointerLeave(frame, { pointerType: "pen" });
    expect(svg).toHaveAttribute("data-view", "assembled");
    fireEvent.pointerEnter(frame, { pointerType: "touch" });
    expect(svg).toHaveAttribute("data-view", "assembled");
  });

  it("does not intercept a click that had no touch pointerdown (assistive technology)", () => {
    const { links } = mount();
    fireEvent.pointerDown(links[0]!, { pointerType: "touch" });
    fireEvent.click(links[0]!); // consumes the touch tap
    expect(fireEvent.click(links[1]!)).toBe(true); // programmatic click, no pointerdown
  });

  it("does not swallow a later activation after a touch gesture that was cancelled (scroll or pan)", () => {
    const { links } = mount();
    fireEvent.pointerDown(links[0]!, { pointerType: "touch" });
    fireEvent.pointerCancel(links[0]!, { pointerType: "touch" });
    // No pointerdown: a keyboard or assistive-technology click on a touch laptop.
    expect(fireEvent.click(links[0]!)).toBe(true);
  });

  it("announces the same first-tap sentence again after the layers were collapsed", async () => {
    const user = userEvent.setup();
    const { links } = mount();
    const status = screen.getByRole("status");
    const tap = () => {
      fireEvent.pointerDown(links[3]!, { pointerType: "touch" });
      fireEvent.click(links[3]!);
    };
    tap();
    expect(status).toHaveTextContent("Components separated.");
    await user.keyboard("{Escape}");
    expect(status).toHaveTextContent("");
    tap();
    expect(status).toHaveTextContent("Components separated. Activate again to open Wet Lab.");
  });

  it("announces the intercepted first touch tap in a polite status region", () => {
    const { links } = mount();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    fireEvent.pointerDown(links[3]!, { pointerType: "touch" });
    fireEvent.click(links[3]!);
    expect(status).toHaveTextContent("Components separated. Activate again to open Wet Lab.");
  });

  it("reports a touch-opened view as pressed and lets the toggle close it", async () => {
    const user = userEvent.setup();
    const { links, svg } = mount();
    fireEvent.pointerDown(links[0]!, { pointerType: "touch" });
    fireEvent.click(links[0]!);
    const toggle = screen.getByRole("button", { name: "Explore components" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(svg).toHaveAttribute("data-view", "assembled");
  });

  it("reassembles on Escape from anywhere on the page and removes its listeners", async () => {
    const user = userEvent.setup();
    const { svg, unmount } = mount();
    await user.click(screen.getByRole("button", { name: "Explore components" }));
    expect(svg).toHaveAttribute("data-view", "exploded");
    const before = document.body.querySelectorAll("*").length;
    act(() => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(svg).toHaveAttribute("data-view", "assembled");
    expect(before).toBeGreaterThan(0);
    const remove = vi.spyOn(document, "removeEventListener");
    await user.click(screen.getByRole("button", { name: "Explore components" }));
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(
      expect.arrayContaining(["pointerdown", "keydown"]),
    );
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
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { links, svg } = mount();
    const link = links[1]!;
    const tap = () => {
      fireEvent.pointerDown(link, { pointerType: "touch" });
      return fireEvent.click(link);
    };
    expect(tap()).toBe(false); // default prevented: no navigation
    expect(svg).toHaveAttribute("data-view", "exploded");
    expect(tap()).toBe(true); // second tap follows the link
    expect(assign).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("navigates on touch pointerup when the layers are already exploded", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { links, svg } = mount();
    fireEvent.pointerDown(links[5]!, { pointerType: "touch" });
    fireEvent.click(links[5]!);
    expect(svg).toHaveAttribute("data-view", "exploded");
    fireEvent.pointerDown(links[5]!, { pointerType: "touch" });
    fireEvent.pointerUp(links[5]!, { pointerType: "touch" });
    expect(assign).toHaveBeenCalled();
    expect(String(assign.mock.calls[0]?.[0])).toMatch(/\/ecosystem\/provenance-dlt$/);
    vi.unstubAllGlobals();
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
    const { links, rerender, onReady } = mount({ initialFocus: ECOSYSTEM_SLUGS[3] });
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

  it("keeps the controls row identical to the static layer so the swap moves nothing", () => {
    const stat = render(<HeroStatic />);
    const staticRow = stat.container.querySelector(".eco-controls")!;
    const staticClasses = staticRow.className;
    const staticHint = staticRow.querySelector("p")!.textContent;
    stat.unmount();
    const { container } = mount();
    const row = container.querySelector(".eco-controls")!;
    expect(row.className).toBe(staticClasses);
    expect(row.querySelector("p")!.textContent).toBe(staticHint);
  });

  it("is axe clean", async () => {
    const { container } = mount();
    await expectNoAxeViolations(container);
  });
});
