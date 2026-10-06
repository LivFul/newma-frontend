import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site/site-header";
import { expectNoAxeViolations } from "../ui/axe";

describe("SiteHeader", () => {
  it("renders a banner with the wordmark home link, two in-page anchors and Access NEWMA", () => {
    const { container } = render(<SiteHeader />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-site-header");
    const home = within(header).getByRole("link", { name: "LivFul NEWMA home" });
    expect(home).toHaveAttribute("href", "/");
    expect(within(header).getByRole("link", { name: "Product" })).toHaveAttribute(
      "href",
      "/#product",
    );
    expect(within(header).getByRole("link", { name: "About LivFul" })).toHaveAttribute(
      "href",
      "/#about",
    );
    const access = within(header).getByRole("link", { name: "Access NEWMA" });
    expect(access).toHaveAttribute("href", "/access");
    expect(access.className).toMatch(/min-h-11/);
    expect(container.querySelector("header")?.className).toMatch(/sticky/);
  });
  it("keeps Access NEWMA visible below md and hides the section anchors there", () => {
    render(<SiteHeader />);
    const product = screen.getByRole("link", { name: "Product" });
    expect(product.closest("nav")?.className).toMatch(/hidden/);
    expect(product.closest("nav")?.className).toMatch(/md:flex/);
    expect(screen.getByRole("link", { name: "Access NEWMA" }).closest("nav")).toBeNull();
  });
  it("links staff to Aveloz just before Access NEWMA, at every breakpoint", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    const aveloz = within(header).getByRole("link", { name: "Aveloz (LivFul staff)" });
    expect(aveloz).toHaveAttribute("href", "https://aveloz.livful.com");
    expect(aveloz).toHaveAttribute("rel", "noopener");
    expect(aveloz).not.toHaveAttribute("target");
    expect(aveloz.className).toMatch(/min-h-11/);
    expect(aveloz.closest("nav")).toBeNull();
    const access = within(header).getByRole("link", { name: "Access NEWMA" });
    expect(aveloz.compareDocumentPosition(access) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("shows short label 'Aveloz' on mobile with sr-only suffix", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    const aveloz = within(header).getByRole("link", { name: "Aveloz (LivFul staff)" });

    // Accessible name is exactly "Aveloz (LivFul staff)" via aria-label
    expect(aveloz).toHaveAttribute("aria-label", "Aveloz (LivFul staff)");

    // Visible text starts with "Aveloz"
    expect(aveloz.textContent).toMatch(/^Aveloz/);

    // Suffix "(LivFul staff)" is in a span with both sr-only and sm:not-sr-only
    const suffix = within(aveloz).getByText("(LivFul staff)");
    expect(suffix.classList.contains("sr-only")).toBe(true);
    expect(suffix.classList.contains("sm:not-sr-only")).toBe(true);
  });
  // Value: protects=the Menu button opens a named list of the section links below md, aria-controls always has a target, and choosing a link closes it; fails_when=the toggle, the link list or the close-on-choose handler breaks; why_new=no test pressed Menu; seam=none
  it("opens the section menu from the Menu button and closes it when a link is chosen", async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteHeader />);
    const menu = screen.getByRole("button", { name: "Menu" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveAttribute("aria-controls", "mobile-sections");
    expect(document.getElementById("mobile-sections")).not.toBeNull();
    expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();

    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    const nav = screen.getByRole("navigation", { name: "Mobile sections" });
    expect(nav).toHaveAttribute("id", "mobile-sections");
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/#product", "/#about"]);
    await expectNoAxeViolations(container);

    await user.click(within(nav).getByRole("link", { name: "Product" }));
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
    expect(document.getElementById("mobile-sections")).not.toBeNull();
  });
  it("is axe clean", async () => {
    const { container } = render(<SiteHeader />);
    await expectNoAxeViolations(container);
  });
});
