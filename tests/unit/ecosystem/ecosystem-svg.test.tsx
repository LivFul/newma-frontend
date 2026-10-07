import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EcosystemSvg } from "@/components/ecosystem-graphic/ecosystem-svg";
import { StaticPart } from "@/components/ecosystem-graphic/static-part";
import { LABEL_FONT, VIEWBOX } from "@/components/ecosystem-graphic/geometry";
import { ECOSYSTEM_SLUGS, HERO_LABELS } from "@/content/ecosystem/registry";
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
      const { title, descriptor } = HERO_LABELS[slug];
      expect(label.startsWith(title)).toBe(true);
      expect(label).toBe(`${title}. ${descriptor}. Opens the ${title} page.`);
      expect(link.textContent).toContain(title);
    }
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

  it("draws the vertical plate stack with leader ticks", () => {
    const { container } = renderSvg();
    expect(container.querySelector(".eco-orbit")).toBeNull();
    expect(container.querySelector(".eco-stage")).toBeNull();
    expect(container.querySelectorAll(".eco-plate-top")).toHaveLength(6);
    expect(container.querySelectorAll(".eco-plate-side")).toHaveLength(6);
    expect(container.querySelectorAll(".eco-leader")).toHaveLength(6);
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
      expect(within(part).getByText(HERO_LABELS[slug].descriptor)).toBeInTheDocument();
    }
  });

  it("is axe clean", async () => {
    const { container } = renderSvg();
    await expectNoAxeViolations(container);
  });
});
