import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { expectNoAxeViolations } from "../ui/axe";

describe("SiteFooter", () => {
  it("is a contentinfo landmark with descriptor, demo notice, footer links and no contact form", () => {
    const { container } = render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/Connecting authorized botanical knowledge/i)).toBeVisible();
    expect(within(footer).getByRole("link", { name: "Explore the Platform" })).toHaveAttribute(
      "href",
      "/access",
    );
    expect(within(footer).getByRole("link", { name: "About Newma" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(within(footer).getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/overview",
    );
    expect(within(footer).getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelector("form")).toBeNull();
  });
  it("states the demo disclaimer and shows no year", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toMatch(/synthetic data/i);
    expect(footer.textContent).toMatch(/in development/i);
    expect(footer.textContent).not.toMatch(/\d{4}/);
  });
  // Value: protects=the footer ships both logo colourways under a dark tone, so CSS can show the reversed one on screen and the dark-ink one in print and under forced colours;
  //   fails_when=the footer goes back to the reversed lockup alone, which vanishes on paper and on a light forced-colours canvas;
  //   why_new=the footer rendered only tone="dark"; seam=none
  it("ships both logo colourways under a dark tone", () => {
    const { container } = render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-tone", "dark");
    expect(footer).toHaveAttribute("data-site-footer");
    expect(container.querySelector("img.wordmark-light")?.getAttribute("src")).toMatch(
      /newma-logo\.svg/,
    );
    expect(container.querySelector("img.wordmark-dark")?.getAttribute("src")).toMatch(
      /newma-logo-reversed\.svg/,
    );
  });
  it("is axe clean", async () => {
    const { container } = render(<SiteFooter />);
    await expectNoAxeViolations(container);
  });
});
