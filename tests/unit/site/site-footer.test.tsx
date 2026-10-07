import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { expectNoAxeViolations } from "../ui/axe";

describe("SiteFooter", () => {
  it("is a contentinfo landmark with descriptor, demo notice, footer links and no contact form", () => {
    const { container } = render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/Connecting authorized botanical knowledge/i)).toBeVisible();
    expect(within(footer).getByRole("link", { name: "Explore the demo" })).toHaveAttribute(
      "href",
      "/access",
    );
    expect(within(footer).getByRole("link", { name: "About Newma" })).toHaveAttribute(
      "href",
      "/#about",
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
  it("is axe clean", async () => {
    const { container } = render(<SiteFooter />);
    await expectNoAxeViolations(container);
  });
});
