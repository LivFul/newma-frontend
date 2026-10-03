import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { expectNoAxeViolations } from "../ui/axe";

describe("SiteFooter", () => {
  it("is a contentinfo landmark with the contact placeholder, both legal links and a secondary Access NEWMA", () => {
    const { container } = render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Contact details to be supplied by LivFul.")).toBeVisible();
    expect(within(footer).getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(within(footer).getByRole("link", { name: "Access NEWMA" })).toHaveAttribute(
      "href",
      "/access",
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelector("form")).toBeNull();
  });
  it("states the demo disclaimer in one sentence and shows no year", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toMatch(/synthetic data/i);
    expect(footer.textContent).not.toMatch(/\d/);
  });
  it("is axe clean", async () => {
    const { container } = render(<SiteFooter />);
    await expectNoAxeViolations(container);
  });
});
