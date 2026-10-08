import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/events", () => ({ trackEvent: (e: unknown) => trackEvent(e) }));

import { AboutNewma } from "@/components/site/about-newma";
import { ComponentIndex } from "@/components/site/component-index";
import { HeroSection } from "@/components/site/hero-section";
import { PersonaGrid } from "@/components/site/persona-grid";
import { ProductIntro } from "@/components/site/product-intro";
import { HERO_SVG_TITLE } from "@/content/ecosystem/hero-text";
import { ECOSYSTEM, ECOSYSTEM_SLUGS } from "@/content/ecosystem/registry";
import { ABOUT, COMPONENTS_INDEX, HERO, PRODUCT } from "@/content/home/copy";
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

  it("offers Explore the demo in the hero and in the product introduction, both to /access", () => {
    renderHome();
    const links = screen.getAllByRole("link", { name: "Explore the demo" });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/access");
    expect(
      within(document.getElementById("hero")!).getAllByRole("link", { name: "Explore the demo" }),
    ).toHaveLength(1);
    expect(
      within(document.getElementById("product")!).getAllByRole("link", {
        name: "Explore the demo",
      }),
    ).toHaveLength(1);
  });

  it("resolves the product, workflow and about anchors to section ids", () => {
    const { container } = renderHome();
    expect(container.querySelector("section#product")).not.toBeNull();
    expect(container.querySelector("section#workflow")).not.toBeNull();
    expect(container.querySelector("section#about")).not.toBeNull();
    expect(screen.getByRole("link", { name: HERO.howCta.text })).toHaveAttribute(
      "href",
      "#workflow",
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
  }, 60_000);
});

describe("HeroSection", () => {
  it("shows the tagline, lede and disclaimer", () => {
    render(<HeroSection />);
    expect(screen.getByText(HERO.tagline.text)).toBeInTheDocument();
    expect(screen.getByText(HERO.lede.text)).toBeInTheDocument();
    expect(screen.getByText(HERO.disclaimer.text)).toBeInTheDocument();
  });

  // Value: protects=mobile LCP: the hero copy (headline, tagline, lede) paints with the first frame, and only the actions rise in after it;
  //   fails_when=an entrance class returns to the copy: an item starts at opacity 0, so on phones the lede (the largest text there) became LCP only after its fade, and Lighthouse's throttling charged every script before it (LCP 3.9 s against a 3 s budget);
  //   why_new=the copy was staggered too, and the old test required it; seam=none
  it("paints the hero copy at once and staggers only the actions", () => {
    const { container } = render(<HeroSection />);
    for (const copy of [
      screen.getByRole("heading", { level: 1 }),
      screen.getByText(HERO.tagline.text),
      screen.getByText(HERO.lede.text),
    ]) {
      expect(copy.className).not.toMatch(/hero-entrance-item/);
    }
    expect(screen.getByText(HERO.disclaimer.text).className).toMatch(/hero-entrance-item/);
    expect(container.querySelectorAll("#hero .hero-entrance-item")).toHaveLength(2);
  });

  it("exposes the ecosystem diagram with its accessible name inside the hero", () => {
    const { container } = render(<HeroSection />);
    const hero = container.querySelector<HTMLElement>("section#hero")!;
    expect(hero.querySelector("figure[data-hero]")).not.toBeNull();
    expect(within(hero).getByRole("group", { name: HERO_SVG_TITLE.text })).toBeInTheDocument();
  });
});

describe("ComponentIndex", () => {
  it("lists six links with the exact titles and component hrefs", () => {
    render(<ComponentIndex />);
    const list = screen.getByRole("list", { name: COMPONENTS_INDEX.listLabel.text });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(6);
    ECOSYSTEM_SLUGS.forEach((slug, i) => {
      expect(links[i]).toHaveAttribute("href", `/ecosystem/${slug}`);
      expect(links[i]).toHaveTextContent(ECOSYSTEM[slug].title);
    });
  });

  // Value: protects=ecosystem cards stagger in and do not translate on hover; fails_when=ComponentIndex drops hover-lift or reveal-child; why_new=motion-utilities checks the utility definition, not the cards; seam=none
  it("staggers the six ecosystem cards and lifts them without a hover translate", () => {
    render(<ComponentIndex />);
    const list = screen.getByRole("list", { name: COMPONENTS_INDEX.listLabel.text });
    const cards = within(list).getAllByRole("listitem");
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.className).toMatch(/\breveal-child\b/);
      expect(within(card).getByRole("link").className).toMatch(/\bhover-lift\b/);
    }
  });
  // Generated by /ship coverage audit
  // Value: protects=each ecosystem card heads its title with only the plate colour swatch, no alternating leaf or pill mark;
  //   fails_when=LeafIcon/PillIcon (or any other decorative svg) returns to the card title, or the PlateSwatch circle is dropped;
  //   why_new=the existing ComponentIndex tests check links, titles and motion classes but never what the card draws; seam=none
  it("draws only the plate swatch beside each card title", () => {
    render(<ComponentIndex />);
    const list = screen.getByRole("list", { name: COMPONENTS_INDEX.listLabel.text });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const link of links) {
      const svgs = link.querySelectorAll("svg");
      expect(svgs, link.textContent ?? "").toHaveLength(1);
      expect(svgs[0]!.querySelectorAll("circle")).toHaveLength(1);
      expect(svgs[0]!.querySelector("circle")!.getAttribute("fill")).toMatch(/^var\(--/);
    }
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
  it("lists five personas, each with a role and a need", () => {
    render(<PersonaGrid />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    for (const item of items) expect(item.querySelectorAll("p")).toHaveLength(2);
    expect(
      screen.getByText("Knowledge holders and authorized community representatives"),
    ).toBeInTheDocument();
  });

  // Value: protects=persona cards join the section reveal stagger; fails_when=PersonaGrid drops reveal-child; why_new=the product test only counts steps inside the ol; seam=none
  it("gives each of the five persona cards the reveal stagger", () => {
    render(<PersonaGrid />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    for (const item of items) expect(item.className).toMatch(/\breveal-child\b/);
  });
});

describe("ProductIntro and AboutNewma", () => {
  it("states the guardrail and four numbered steps", () => {
    const { container } = render(<ProductIntro />);
    expect(screen.getByText(PRODUCT.guardrail.text)).toBeInTheDocument();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(container.querySelector("#product > div")?.className).toMatch(/max-w-\[80rem\]/);
    expect(container.querySelectorAll("#product ol .reveal-child")).toHaveLength(4);
  });
  it("About has mission, vision and approach", () => {
    render(<AboutNewma />);
    expect(screen.getByRole("heading", { name: ABOUT.heading.text })).toBeInTheDocument();
    expect(screen.getByText(MISSION.text)).toBeInTheDocument();
    expect(screen.getByText(VISION.text)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approach" })).toBeInTheDocument();
    expect(screen.getByText(/Start with unmet needs/)).toBeInTheDocument();
  });
});
