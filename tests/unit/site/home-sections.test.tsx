import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/events", () => ({ trackEvent: (e: unknown) => trackEvent(e) }));

import { AboutLivful } from "@/components/site/about-livful";
import { ComponentIndex } from "@/components/site/component-index";
import { HeroSection } from "@/components/site/hero-section";
import { PersonaGrid } from "@/components/site/persona-grid";
import { ProductIntro } from "@/components/site/product-intro";
import { HERO_LABELS, ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { ABOUT, HERO, PRODUCT } from "@/content/home/copy";
import { MISSION, VISION } from "@/content/home/about";
import { expectNoAxeViolations } from "../ui/axe";
import HomePage from "@/app/(site)/page";

function renderHome() {
  return render(
    <main>
      <HomePage />
    </main>,
  );
}

describe("home page composition", () => {
  it("has exactly one h1 with the hero title", () => {
    renderHome();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(HERO.title.text);
  });

  it("has no heading-level skips from h1 downward", () => {
    renderHome();
    const levels = screen.getAllByRole("heading").map((h) => Number(h.tagName[1]));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]! - levels[i - 1]!, `heading ${i}`).toBeLessThanOrEqual(1);
    }
  });

  it("labels every section with its heading", () => {
    const { container } = renderHome();
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBeGreaterThanOrEqual(4);
    for (const section of sections) {
      const id = section.getAttribute("aria-labelledby");
      expect(id, section.outerHTML.slice(0, 80)).toBeTruthy();
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("offers See the demo in the hero and in the product introduction, both to /access", () => {
    renderHome();
    const links = screen.getAllByRole("link", { name: "See the demo" });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/access");
    expect(
      within(document.getElementById("hero")!).getAllByRole("link", { name: "See the demo" }),
    ).toHaveLength(1);
    expect(
      within(document.getElementById("product")!).getAllByRole("link", { name: "See the demo" }),
    ).toHaveLength(1);
  });

  it("resolves the product and about anchors to section ids", () => {
    const { container } = renderHome();
    expect(container.querySelector("section#product")).not.toBeNull();
    expect(container.querySelector("section#about")).not.toBeNull();
    expect(screen.getByRole("link", { name: HERO.howCta.text })).toHaveAttribute(
      "href",
      "#product",
    );
  });

  it("renders the hero figure with its six links", () => {
    const { container } = renderHome();
    expect(container.querySelector("figure[data-hero]")).not.toBeNull();
    expect(container.querySelectorAll("figure[data-hero] svg a[href^='/ecosystem/']")).toHaveLength(
      6,
    );
  });

  it("is axe clean", async () => {
    const { container } = renderHome();
    await expectNoAxeViolations(container);
  });
});

describe("HeroSection", () => {
  it("shows the lede and disclaimer", () => {
    render(<HeroSection />);
    expect(screen.getByText(HERO.lede.text)).toBeInTheDocument();
    expect(screen.getByText(HERO.disclaimer.text)).toBeInTheDocument();
  });

  // Value: protects=hero map key labels render and the A-H / 1-5 grid references stay out of the accessibility tree; fails_when=a label is dropped or aria-hidden is lost on the tick rows; why_new=HeroSection test only covered lede and disclaimer; seam=none
  it("keeps the pipeline diagram in a glass panel without the survey map key", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector(".sheet-ticks-x")).toBeNull();
    expect(container.querySelector(".glass")).not.toBeNull();
    expect(container.querySelector("figure[data-hero]")).not.toBeNull();
  });
});

describe("ComponentIndex", () => {
  it("lists six links with the exact titles and component hrefs", () => {
    render(<ComponentIndex />);
    const list = screen.getByRole("list");
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(6);
    ECOSYSTEM_SLUGS.forEach((slug, i) => {
      expect(links[i]).toHaveAttribute("href", `/ecosystem/${slug}`);
      expect(links[i]).toHaveTextContent(HERO_LABELS[slug].title);
    });
    expect(links.map((l) => l.textContent)).toEqual(
      ECOSYSTEM_SLUGS.map((s) => `${HERO_LABELS[s].title}${HERO_LABELS[s].descriptor}`),
    );
  });
});

describe("ComponentLink", () => {
  beforeEach(() => trackEvent.mockClear());
  it("counts component_open with only the slug when an index link is clicked", async () => {
    const user = userEvent.setup();
    render(<ComponentIndex />);
    const link = screen.getByRole("link", { name: /^Wet Lab/ });
    link.addEventListener("click", (e) => e.preventDefault());
    await user.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({ name: "component_open", slug: "wet-lab" });
  });
});

describe("PersonaGrid", () => {
  it("lists four personas, each with a role and a need", () => {
    render(<PersonaGrid />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    for (const item of items) expect(item.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("Indigenous community liaison")).toBeInTheDocument();
  });
});

describe("ProductIntro and AboutLivful", () => {
  it("states the guardrail and four numbered steps", () => {
    const { container } = render(<ProductIntro />);
    expect(screen.getByText(PRODUCT.guardrail.text)).toBeInTheDocument();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });
  it("About has mission, vision and approach", () => {
    render(<AboutLivful />);
    expect(screen.getByRole("heading", { name: ABOUT.heading.text })).toBeInTheDocument();
    expect(screen.getByText(MISSION.text)).toBeInTheDocument();
    expect(screen.getByText(VISION.text)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approach" })).toBeInTheDocument();
    expect(screen.getByText(/not results achieved/)).toBeInTheDocument();
  });
});
