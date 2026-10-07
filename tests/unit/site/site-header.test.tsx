import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { expectNoAxeViolations } from "../ui/axe";

async function flush(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function mockReducedMotion(reduced: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe("SiteHeader", () => {
  it("renders a banner with the wordmark home link, four in-page anchors and Access NEWMA", () => {
    const { container } = render(<SiteHeader />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-site-header");
    const home = within(header).getByRole("link", {
      name: "NEWMA by LivFul Therapeutics",
    });
    expect(home).toHaveAttribute("href", "/");
    expect(within(header).getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/#product",
    );
    expect(within(header).getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "/#workflow",
    );
    expect(within(header).getByRole("link", { name: "Ecosystem" })).toHaveAttribute(
      "href",
      "/#components",
    );
    expect(within(header).getByRole("link", { name: "About Newma" })).toHaveAttribute(
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
    const overview = screen.getByRole("link", { name: "Overview" });
    expect(overview.closest("nav")?.className).toMatch(/hidden/);
    expect(overview.closest("nav")?.className).toMatch(/md:flex/);
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
    expect(aveloz).toHaveAttribute("aria-label", "Aveloz (LivFul staff)");
    expect(aveloz.textContent).toMatch(/^Aveloz/);
    const suffix = within(aveloz).getByText("(LivFul staff)");
    expect(suffix.classList.contains("sr-only")).toBe(true);
    expect(suffix.classList.contains("sm:not-sr-only")).toBe(true);
  });
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
    ).toEqual(["/#product", "/#workflow", "/#components", "/#about"]);
    await expectNoAxeViolations(container);

    await user.click(within(nav).getByRole("link", { name: "Overview" }));
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
    });
    expect(document.getElementById("mobile-sections")).not.toBeNull();
  });

  it("marks the header once the page has scrolled", async () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveAttribute("data-scrolled");
    vi.spyOn(window, "scrollY", "get").mockReturnValue(24);
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });
    expect(header).toHaveAttribute("data-scrolled");
  });

  // Value: protects=the header returns to the solid bar at the top of the page; fails_when=data-scrolled is only ever set; why_new=the existing scroll test only moves to 24; seam=none
  it("clears the scrolled mark when the page returns to the top", async () => {
    const scrollY = vi.spyOn(window, "scrollY", "get");
    scrollY.mockReturnValue(0);
    try {
      render(<SiteHeader />);
      const header = screen.getByRole("banner");
      scrollY.mockReturnValue(24);
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
      expect(header).toHaveAttribute("data-scrolled");
      scrollY.mockReturnValue(0);
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
      expect(header).not.toHaveAttribute("data-scrolled");
    } finally {
      scrollY.mockRestore();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=closing the mobile menu keeps it mounted with data-open false until the close delay elapses;
  //   fails_when=the menu is hidden immediately or the delay no longer tracks 80% of --motion-duration-base;
  //   why_new=site-header and mobile-menu only wait until the menu is eventually hidden, which also passes if removal is synchronous; seam=none
  it("keeps the mobile menu mounted until the close delay elapses", async () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-duration-base", "280ms");
    try {
      render(<SiteHeader />);
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      fireEvent.click(within(nav).getByRole("link", { name: "Overview" }));
      expect(nav).toHaveAttribute("data-open", "false");
      expect(nav).not.toHaveAttribute("hidden");
      await flush(223);
      expect(nav).not.toHaveAttribute("hidden");
      await flush(1);
      expect(nav).toHaveAttribute("hidden");
      expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
    } finally {
      document.documentElement.style.removeProperty("--motion-duration-base");
      vi.useRealTimers();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=reduced motion removes the mobile menu on the next tick instead of waiting out the close delay;
  //   fails_when=the prefers-reduced-motion guard is removed so the menu stays open for the full delay;
  //   why_new=the close-delay test uses the motion token and never stubs reduced motion; seam=none
  it("drops the mobile menu immediately when the visitor prefers reduced motion", async () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-duration-base", "280ms");
    mockReducedMotion(true);
    try {
      render(<SiteHeader />);
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      fireEvent.click(within(nav).getByRole("link", { name: "Overview" }));
      expect(nav).toHaveAttribute("data-open", "false");
      expect(nav).not.toHaveAttribute("hidden");
      await flush(0);
      expect(nav).toHaveAttribute("hidden");
      expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
    } finally {
      document.documentElement.style.removeProperty("--motion-duration-base");
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=reopening the mobile menu during the close delay cancels the pending unmount;
  //   fails_when=the timeout is not cleared and the menu disappears while aria-expanded is true;
  //   why_new=the close-delay test never reopens the menu before the timer fires; seam=none
  it("cancels the mobile menu unmount when it is reopened during the close delay", async () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-duration-base", "280ms");
    try {
      render(<SiteHeader />);
      const menu = screen.getByRole("button", { name: "Menu" });
      fireEvent.click(menu);
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      fireEvent.click(within(nav).getByRole("link", { name: "Overview" }));
      expect(nav).toHaveAttribute("data-open", "false");
      fireEvent.click(menu);
      expect(menu).toHaveAttribute("aria-expanded", "true");
      expect(nav).toHaveAttribute("data-open", "true");
      await flush(1000);
      expect(nav).not.toHaveAttribute("hidden");
      expect(nav).toHaveAttribute("data-open", "true");
      expect(menu).toHaveAttribute("aria-expanded", "true");
    } finally {
      document.documentElement.style.removeProperty("--motion-duration-base");
      vi.useRealTimers();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=only the header wordmark is named wordmark for the cross-route view transition;
  //   fails_when=the header drops the name or the footer lockup on the same page takes it too;
  //   why_new=no test reads viewTransitionName, so a second named lockup or a missing header name would pass; seam=none
  it("names only the header wordmark for the cross-route view transition", () => {
    render(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );
    const named = [...document.querySelectorAll("img")].filter(
      (img) => img.style.viewTransitionName === "wordmark",
    );
    expect(named).toHaveLength(1);
    expect(named[0]?.closest("[data-site-header]")).not.toBeNull();
  });

  it("is axe clean", async () => {
    const { container } = render(<SiteHeader />);
    await expectNoAxeViolations(container);
  });
});
