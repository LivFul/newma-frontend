import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EcosystemSvg } from "@/components/ecosystem-graphic/ecosystem-svg";
import { StaticPart } from "@/components/ecosystem-graphic/static-part";
import { LABEL_FONT, VIEWBOX } from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS, heroRowCopy } from "@/content/ecosystem/registry";
import { HERO_SVG_DESC } from "@/content/ecosystem/hero-text";
import { HERO_CONTROLS } from "@/content/home/hero-help";
import { expectNoAxeViolations } from "../ui/axe";

function renderSvg() {
  return render(<EcosystemSvg Part={StaticPart} svgId="eco-test" />);
}

describe("EcosystemSvg", () => {
  it("renders six links inside groups with the component hrefs", () => {
    const { container } = renderSvg();
    const links = container.querySelectorAll("svg g a[href]");
    expect(links).toHaveLength(6);
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(ECOSYSTEM_SLUGS.map((s) => `/ecosystem/${s}`));
    for (const slug of ECOSYSTEM_SLUGS) {
      expect(container.querySelector(`g[data-slug="${slug}"] > a`)).not.toBeNull();
    }
  });

  it("starts every accessible name with the visible label (WCAG 2.5.3)", () => {
    const { container } = renderSvg();
    for (const slug of ECOSYSTEM_SLUGS) {
      const link = container.querySelector(`g[data-slug="${slug}"] > a`)!;
      const label = link.getAttribute("aria-label")!;
      const { title, descriptor } = heroRowCopy(slug);
      expect(label.startsWith(title)).toBe(true);
      expect(label).toBe(`${title}. ${descriptor}. Opens the ${title} page.`);
      expect(link.textContent).toContain(title);
    }
  });

  // Value: protects=screen-reader users learn the diagram's arrow, Home/End, Escape and tap controls now that the visible Keyboard help is gone (D12), and only where those controls work;
  //   fails_when=the controls sentence is dropped from the interactive layer's description, or is announced on the static layer that does not answer the keys;
  //   why_new=nothing on the page described the controls after Keyboard help was removed; seam=none
  it("describes the controls on the interactive layer only", () => {
    const desc = (layer: "static" | "interactive") =>
      render(
        <EcosystemSvg Part={StaticPart} svgId={`eco-${layer}`} layer={layer} />,
      ).container.querySelector("desc")?.textContent;
    expect(desc("interactive")).toBe(`${HERO_SVG_DESC.text} ${HERO_CONTROLS.text}`);
    expect(desc("static")).toBe(HERO_SVG_DESC.text);
    expect(HERO_CONTROLS.text).toMatch(/arrow keys/i);
    expect(HERO_CONTROLS.text).toMatch(/Home and End/);
    expect(HERO_CONTROLS.text).toMatch(/Escape/);
    expect(HERO_CONTROLS.text).toMatch(/tap/i);
  });

  it("is one svg group with a title and a description, never role=img", () => {
    const { container } = renderSvg();
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    const svg = svgs[0]!;
    expect(svg.getAttribute("role")).toBe("group");
    expect(container.querySelector('[role="img"]')).toBeNull();
    // The name is the short title; the long description is only a description.
    const labelledBy = svg.getAttribute("aria-labelledby")!;
    const describedBy = svg.getAttribute("aria-describedby")!;
    expect(labelledBy.split(" ")).toHaveLength(1);
    expect(container.querySelector(`#${labelledBy}`)?.tagName.toLowerCase()).toBe("title");
    expect(container.querySelector(`#${describedBy}`)?.tagName.toLowerCase()).toBe("desc");
    expect(svg.querySelector("title")?.textContent).toBe("NEWMA ecosystem diagram");
    expect(svg.querySelector("desc")?.textContent?.length).toBeGreaterThan(40);
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`);
  });

  it("draws a spine and six outlined bars, with no row expanded at rest", () => {
    const { container } = renderSvg();
    expect(container.querySelector(".eco-spine")).not.toBeNull();
    // No decorative source curves: the bracket and rows stand on their own.
    expect(container.querySelector(".eco-curves")).toBeNull();
    expect(container.querySelectorAll(".eco-bar")).toHaveLength(6);
    expect(container.querySelectorAll(".eco-tick")).toHaveLength(6);
    // The open view draws only the flow arrows; the rails would be a second bracket beside the spine.
    const edges = Array.from(container.querySelectorAll(".eco-edges path"));
    expect(edges).toHaveLength(5);
    expect(edges.every((p) => p.getAttribute("data-kind") === "flow")).toBe(true);
    // No resting arrow: Interface sits in the stack like every other row.
    expect(container.querySelector(".eco-cue")).toBeNull();
    // No row is expanded at rest: Interface's descriptor waits for the explode like the others.
    expect(container.querySelector(".eco-desc[data-resting]")).toBeNull();
    const titleY = (slug: string) =>
      container.querySelector(`[data-slug="${slug}"] .eco-title`)?.getAttribute("y");
    for (const slug of ECOSYSTEM_SLUGS) expect(titleY(slug), slug).toBe(titleY("wet-lab"));
    expect(container.querySelector('[data-slug="interface"] .eco-desc')?.textContent).toBe(
      "Research Workspace",
    );
    expect(container.querySelector('[data-slug="wet-lab"] .eco-title')?.textContent).toBe(
      "Wet Labs",
    );
  });

  it("keeps rendered label text at least 12 px on a 328 px wide content column", () => {
    const CONTENT_WIDTH_ON_360_PHONE = 328;
    const scale = CONTENT_WIDTH_ON_360_PHONE / VIEWBOX.width;
    expect(LABEL_FONT.title * scale).toBeGreaterThanOrEqual(12);
    expect(LABEL_FONT.descriptor * scale).toBeGreaterThanOrEqual(12);
    const { container } = renderSvg();
    const sizes = Array.from(container.querySelectorAll("text")).map((t) =>
      Number(t.getAttribute("font-size")),
    );
    expect(sizes.length).toBeGreaterThanOrEqual(12);
    for (const size of sizes) expect(size * scale).toBeGreaterThanOrEqual(12);
  });

  it("shows the descriptor text for every part", () => {
    const { container } = renderSvg();
    for (const slug of ECOSYSTEM_SLUGS) {
      const part = container.querySelector(`g[data-slug="${slug}"]`) as HTMLElement;
      expect(within(part).getByText(heroRowCopy(slug).descriptor)).toBeInTheDocument();
    }
  });

  it("is axe clean", async () => {
    const { container } = renderSvg();
    await expectNoAxeViolations(container);
  });
});
