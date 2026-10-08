import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { expectNoAxeViolations } from "../ui/axe";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

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
    const access = within(header).getByRole("link", { name: /^Access NEWMA/ });
    expect(access).toHaveAttribute("href", "/access");
    expect(access.className).toMatch(/min-h-11/);
    expect(container.querySelector("header")?.className).toMatch(/sticky/);
  });
  it("keeps Access NEWMA visible below lg and hides the section anchors there", () => {
    render(<SiteHeader />);
    const overview = screen.getByRole("link", { name: "Overview" });
    expect(overview.closest("nav")?.className).toMatch(/hidden/);
    expect(overview.closest("nav")?.className).toMatch(/lg:flex/);
    expect(screen.getByRole("link", { name: /^Access NEWMA/ }).closest("nav")).toBeNull();
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
    const access = within(header).getByRole("link", { name: /^Access NEWMA/ });
    expect(aveloz.compareDocumentPosition(access) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  // Value: protects=below xl the call to action reads "Demo" so the logo, Menu, Aveloz and Demo share one row, while its accessible name still starts with "Access NEWMA" and contains the visible word (WCAG 2.5.3); it carries the attention ring;
  //   fails_when=the short label shows at xl (both labels visible), the full label leaves the accessible name, the visible "Demo" drops out of the name, or the ring class is lost;
  //   why_new=the header CTA had one label at every width; seam=none
  it("labels the call to action Demo below xl and keeps Access NEWMA in its name", () => {
    render(<SiteHeader />);
    const access = within(screen.getByRole("banner")).getByRole("link", {
      name: "Access NEWMA Demo",
    });
    expect(within(access).getByText("Access NEWMA").className).toBe("sr-only xl:not-sr-only");
    expect(within(access).getByText("Demo").className).toBe("xl:hidden");
    expect(access.className).toMatch(/(^|\s)cta-attention(\s|$)/);
  });
  it("shows short label 'Aveloz' on mobile with sr-only suffix", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    const aveloz = within(header).getByRole("link", { name: "Aveloz (LivFul staff)" });
    expect(aveloz).toHaveAttribute("aria-label", "Aveloz (LivFul staff)");
    expect(aveloz.textContent).toMatch(/^Aveloz/);
    const suffix = within(aveloz).getByText("(LivFul staff)");
    expect(suffix.classList.contains("sr-only")).toBe(true);
    expect(suffix.classList.contains("xl:not-sr-only")).toBe(true);
  });
  // Value: protects=the open menu sheet closes on Escape (focus back on Menu) and when focus leaves the header, so a focused element never lands under the open sheet (WCAG 2.4.11);
  //   fails_when=the Escape or focusout handler is dropped, Escape strands focus, or focus moving between the header's own controls closes the sheet;
  //   why_new=the sheet could only be closed by a link or the toggle, and --header-h leaves the open sheet out on the premise that it never stays open; seam=none
  it("closes the menu sheet on Escape and when focus leaves the header", async () => {
    const user = userEvent.setup();
    const outside = document.body.appendChild(document.createElement("button"));
    try {
      render(<SiteHeader />);
      const menu = screen.getByRole("button", { name: "Menu" });

      await user.click(menu);
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      within(nav).getByRole("link", { name: "Overview" }).focus();
      await user.keyboard("{Escape}");
      expect(menu).toHaveAttribute("aria-expanded", "false");
      expect(menu).toHaveFocus();

      await user.click(menu);
      const links = within(
        screen.getByRole("navigation", { name: "Mobile sections" }),
      ).getAllByRole("link");
      act(() => links[0]!.focus());
      act(() => links[1]!.focus());
      expect(menu).toHaveAttribute("aria-expanded", "true");
      act(() => outside.focus());
      expect(menu).toHaveAttribute("aria-expanded", "false");

      // Generated by /ship coverage audit
      // Value: protects=Escape is only the sheet's while it is open: with the sheet closed, Escape elsewhere on the page leaves focus where it is;
      //   fails_when=the keydown listener is installed for the header's whole life (the [open] guard or dependency is dropped), so any Escape yanks focus to Menu;
      //   why_new=the test above only presses Escape with the sheet open; seam=none
      await user.keyboard("{Escape}");
      expect(outside).toHaveFocus();
      expect(menu).not.toHaveFocus();
    } finally {
      outside.remove();
    }
  });

  // Value: protects=only the glass capsule takes pointer input; the clear gutters of the full-width sticky header pass clicks through to the content beneath;
  //   fails_when=pointer-events-none leaves the header or pointer-events-auto leaves the capsule, so links beside or above the capsule cannot be clicked (or the header itself goes dead);
  //   why_new=the header lost its own background in the Liquid Glass rework, which made its padding an invisible click shield; seam=none
  it("lets clicks through the clear gutters and keeps the capsule interactive", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    expect(header.className).toMatch(/(^|\s)pointer-events-none(\s|$)/);
    expect(header.querySelector(".glass")?.className).toMatch(/(^|\s)pointer-events-auto(\s|$)/);
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

  // Value: protects=an open menu closes when the viewport widens past lg (a phone or tablet rotating), so the hidden sheet does not keep its Escape and focusout listeners attached;
  //   fails_when=the (min-width: 64rem) listener is dropped, reacts to narrowing instead, or outlives the open menu;
  //   why_new=the sheet is lg:hidden, so a menu opened below lg stayed open and listening after the viewport crossed lg; seam=none
  it("closes the open menu when the viewport widens to lg", async () => {
    const listeners = new Map<string, (event: MediaQueryListEvent) => void>();
    const removed: string[] = [];
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
            listeners.set(query, listener);
          },
          removeEventListener: () => {
            removed.push(query);
          },
        }) as unknown as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<SiteHeader />);
    const menu = screen.getByRole("button", { name: "Menu" });
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    const wide = listeners.get("(min-width: 64rem)");
    expect(wide).toBeDefined();

    act(() => wide!({ matches: false } as MediaQueryListEvent));
    expect(menu).toHaveAttribute("aria-expanded", "true");
    act(() => wide!({ matches: true } as MediaQueryListEvent));
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(removed).toContain("(min-width: 64rem)");
  });

  // Value: protects=a menu left open across a client-side navigation (the wordmark home link sits in the header, so focus never leaves it) closes on the new page;
  //   fails_when=the pathname check is dropped, so the sheet stays open over the next page's content;
  //   why_new=only section links closed the sheet, and the focusout close never fires for a link inside the header; seam=none
  it("closes the open menu after a client-side navigation", async () => {
    const user = userEvent.setup();
    nav.pathname = "/";
    try {
      const { rerender } = render(<SiteHeader />);
      const menu = screen.getByRole("button", { name: "Menu" });
      await user.click(menu);
      expect(menu).toHaveAttribute("aria-expanded", "true");
      nav.pathname = "/ecosystem/wet-lab";
      rerender(<SiteHeader />);
      expect(menu).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => {
        expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
      });
    } finally {
      nav.pathname = "/";
    }
  });

  // Value: protects=the header takes the tone of the new page after a client-side navigation, which fires no scroll or resize;
  //   fails_when=the pathname effect is dropped, so the capsule keeps the previous page's tone until the visitor scrolls;
  //   why_new=the tone was only probed on mount, scroll, resize and header size changes; seam=none
  it("re-probes the tone after a client-side navigation", async () => {
    const paper = document.body.appendChild(document.createElement("p"));
    const plate = document.body.appendChild(document.createElement("section"));
    plate.className = "plate-surface";
    let beneath: Element[] = [paper];
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: () => beneath,
    });
    try {
      nav.pathname = "/";
      const { rerender } = render(<SiteHeader />);
      const header = screen.getByRole("banner");
      expect(header).toHaveAttribute("data-tone", "light");
      beneath = [plate];
      nav.pathname = "/ecosystem/wet-lab";
      await act(async () => {
        rerender(<SiteHeader />);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
      expect(header).toHaveAttribute("data-tone", "dark");
    } finally {
      nav.pathname = "/";
      Reflect.deleteProperty(document, "elementsFromPoint");
      paper.remove();
      plate.remove();
    }
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
  // Value: protects=closing the mobile menu with the Menu toggle keeps it mounted with data-open false until the close delay elapses;
  //   fails_when=the menu is hidden immediately or the delay no longer tracks 80% of --motion-duration-base;
  //   why_new=site-header and mobile-menu only wait until the menu is eventually hidden, which also passes if removal is synchronous; seam=none
  it("keeps the mobile menu mounted until the close delay elapses", async () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-duration-base", "280ms");
    try {
      render(<SiteHeader />);
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      expect(nav).not.toHaveAttribute("inert");
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      expect(nav).toHaveAttribute("data-open", "false");
      expect(nav).not.toHaveAttribute("hidden");
      // The fading sheet is invisible: it must not take a second tap or focus while it closes.
      expect(nav).toHaveAttribute("inert");
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

  // Generated by /ship pre-landing review
  // Value: protects=choosing a section hides the sheet in the same task, before the anchor scroll, so the section lands below the closed header;
  //   fails_when=a chosen link only starts the fade (sheet left in flow ~224ms), so the scroll overshoots by the sheet's height (QA: -103px vs 110px);
  //   why_new=every close test waited out or asserted the fade, which is right for the toggle but wrong for navigation (and the links unmounted mid-click); seam=none
  it("hides the sheet at once when a section is chosen", () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-duration-base", "280ms");
    try {
      render(<SiteHeader />);
      const menu = screen.getByRole("button", { name: "Menu" });
      fireEvent.click(menu);
      const nav = screen.getByRole("navigation", { name: "Mobile sections" });
      fireEvent.click(within(nav).getByRole("link", { name: "How it works" }));
      expect(nav).toHaveAttribute("hidden");
      expect(menu).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("navigation", { name: "Mobile sections" })).toBeNull();
      // The chosen link stays mounted (hidden and inert), so engines that skip navigation for a
      // detached anchor still follow it.
      expect(nav.querySelectorAll("a")).toHaveLength(4);
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
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
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
      fireEvent.click(menu);
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
    // The name sits on the lockup's wrapper, which holds both colourways of the adaptive header wordmark.
    const named = [...document.querySelectorAll<HTMLElement>("*")].filter(
      (el) => el.style.viewTransitionName === "wordmark",
    );
    expect(named).toHaveLength(1);
    expect(named[0]?.closest("[data-site-header]")).not.toBeNull();
  });

  // Generated by /ship coverage audit
  // Value: protects=the Liquid Glass header turns dark over a dark plate or the footer, back to light over paper, re-probes on resize, and keeps its current tone when hit-testing throws;
  //   fails_when=the probe stops skipping the header's own elements, leaves the capsule's middle, resets the tone when only the header is hit, the .plate-surface/[data-surface="dark"] match changes or widens back to any <footer>, the resize listener is dropped, or the catch resets the tone to light;
  //   why_new=no test controlled elementsFromPoint, so jsdom only ever exercised the throw path and data-tone never left its server default; seam=none
  it("takes the tone of the content beneath it and keeps it when hit-testing fails", async () => {
    const plate = document.createElement("section");
    plate.className = "plate-surface";
    const plateText = plate.appendChild(document.createElement("p"));
    const footer = document.createElement("footer");
    footer.dataset.surface = "dark";
    const footerText = footer.appendChild(document.createElement("p"));
    // A semantic <footer> inside a light card is not a dark surface.
    const cardFooter = document.createElement("footer");
    const cardFooterText = cardFooter.appendChild(document.createElement("p"));
    const paper = document.createElement("p");
    document.body.append(plate, footer, cardFooter, paper);
    let beneath: () => Element[] = () => [paper];
    const probes: number[] = [];
    // axe's jsdom polyfill throws, so the probe is replaced on the document for this test only.
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: (_x: number, y: number) => {
        probes.push(y);
        return beneath();
      },
    });
    const settle = async (event: "scroll" | "resize") => {
      await act(async () => {
        window.dispatchEvent(new Event(event));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
    };
    try {
      render(<SiteHeader />);
      const header = screen.getByRole("banner");
      expect(header).toHaveAttribute("data-tone", "light");

      // The header's own glass is topmost at the probe point; it must be skipped, not read.
      const own = header.querySelector(".glass")!;
      // The probe reads behind the middle of the capsule's label row, not its lower edge or an open sheet.
      const row = header.querySelector("[data-header-row]")!;
      expect(row.parentElement).toBe(own);
      vi.spyOn(row, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 8, 1200, 56));
      vi.spyOn(own, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 8, 1200, 230));
      vi.spyOn(header, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 1280, 66));
      beneath = () => [own, plateText];
      await settle("scroll");
      expect(header).toHaveAttribute("data-tone", "dark");
      expect(probes.at(-1)).toBe(36);

      // Only the header's own elements at the probe point: the tone is unknown, so it stays as it was.
      beneath = () => [own];
      await settle("scroll");
      expect(header).toHaveAttribute("data-tone", "dark");

      beneath = () => [paper];
      await settle("resize");
      expect(header).toHaveAttribute("data-tone", "light");

      beneath = () => [own, cardFooterText];
      await settle("scroll");
      expect(header).toHaveAttribute("data-tone", "light");

      beneath = () => [own, footerText];
      await settle("scroll");
      expect(header).toHaveAttribute("data-tone", "dark");

      beneath = () => {
        throw new Error("no hit-testing");
      };
      await settle("scroll");
      expect(header).toHaveAttribute("data-tone", "dark");
    } finally {
      Reflect.deleteProperty(document, "elementsFromPoint");
      plate.remove();
      footer.remove();
      cardFooter.remove();
      paper.remove();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=the real site footer reads as a dark surface to the header's tone probe, so the glass capsule turns dark over it;
  //   fails_when=data-surface="dark" is dropped from SiteFooter (the probe no longer matches any <footer>), leaving a pale capsule floating on the deep footer;
  //   why_new=the tone test builds its own data-surface footer, so it still passes when the real SiteFooter loses the marker; seam=none
  it("turns dark over the real site footer", async () => {
    const { container } = render(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );
    const footerText = within(screen.getByRole("contentinfo")).getByText(/synthetic data/i);
    const own = container.querySelector("[data-site-header] .glass")!;
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: () => [own, footerText],
    });
    try {
      const header = screen.getByRole("banner");
      expect(header).toHaveAttribute("data-tone", "light");
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
      expect(header).toHaveAttribute("data-tone", "dark");
    } finally {
      Reflect.deleteProperty(document, "elementsFromPoint");
    }
  });

  // Value: protects=anchors and keyboard focus clear the sticky header at any width, because the header publishes its real (possibly wrapped) height for scroll-padding and withdraws it on unmount; fails_when=the observer is dropped, publishes the wrong size, or leaves a stale height behind after the header unmounts; why_new=the header wraps at 441–480px and ~600–700px where no breakpoint literal applies, and nothing checked the live height; seam=none
  it("publishes its live height as --header-h and withdraws it on unmount", () => {
    let report: ResizeObserverCallback = () => undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          report = callback;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve() {}
      },
    );
    const root = document.documentElement;
    try {
      const { container, unmount } = render(<SiteHeader />);
      const header = container.querySelector<HTMLElement>("[data-site-header]")!;
      expect(observe).toHaveBeenCalledWith(header);

      const entry = { borderBoxSize: [{ blockSize: 109.4, inlineSize: 480 }] };
      act(() => report([entry as unknown as ResizeObserverEntry], {} as ResizeObserver));
      expect(root.style.getPropertyValue("--header-h")).toBe("110px");

      // Engines without borderBoxSize (older Safari) fall back to the header's offsetHeight.
      Object.defineProperty(header, "offsetHeight", { configurable: true, value: 63.2 });
      act(() => report([{} as ResizeObserverEntry], {} as ResizeObserver));
      expect(root.style.getPropertyValue("--header-h")).toBe("64px");

      unmount();
      expect(disconnect).toHaveBeenCalled();
      expect(root.style.getPropertyValue("--header-h")).toBe("");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // Generated by /ship coverage audit
  // Value: protects=opening the menu sheet does not inflate --header-h (scroll-padding would otherwise jump by the sheet's height and anchors land far below the header), a resize that keeps the same height writes nothing, and every size change re-probes the tone;
  //   fails_when=the #mobile-sections height is no longer subtracted, the published-value guard is dropped so each callback rewrites the root style, or the observer stops calling onScroll;
  //   why_new=the --header-h test never opens the menu and only reports distinct heights; seam=none
  it("leaves the open menu sheet out of --header-h and writes only when the height changes", () => {
    let report: ResizeObserverCallback = () => undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          report = callback;
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    const root = document.documentElement;
    const setProperty = vi.spyOn(root.style, "setProperty");
    const frame = vi.spyOn(window, "requestAnimationFrame");
    const resize = (blockSize: number) =>
      act(() =>
        report(
          [{ borderBoxSize: [{ blockSize, inlineSize: 390 }] } as unknown as ResizeObserverEntry],
          {} as ResizeObserver,
        ),
      );
    try {
      const { unmount } = render(<SiteHeader />);
      resize(64);
      expect(root.style.getPropertyValue("--header-h")).toBe("64px");

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const sheet = screen.getByRole("navigation", { name: "Mobile sections" });
      vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue({ height: 180.5 } as DOMRect);
      const writes = setProperty.mock.calls.length;
      const frames = frame.mock.calls.length;
      resize(244.5);
      expect(root.style.getPropertyValue("--header-h")).toBe("64px");
      expect(setProperty.mock.calls.length).toBe(writes);
      expect(frame.mock.calls.length).toBeGreaterThan(frames);

      resize(300.5);
      expect(root.style.getPropertyValue("--header-h")).toBe("120px");
      unmount();
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  // Value: protects=browsers without ResizeObserver still render and unmount the header cleanly and fall back to the CSS literals; fails_when=the observer is constructed unguarded (a ReferenceError breaks the page) or a stale --header-h is left behind; why_new=the guarded branch was untested; seam=none
  it("works without ResizeObserver and publishes nothing", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    try {
      const { unmount } = render(<SiteHeader />);
      expect(document.documentElement.style.getPropertyValue("--header-h")).toBe("");
      expect(() => unmount()).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("is axe clean", async () => {
    const { container } = render(<SiteHeader />);
    await expectNoAxeViolations(container);
  });
});
