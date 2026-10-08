"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ACCESS_LABEL,
  AVELOZ_LINK,
  HEADER_MENU,
  HEADER_MOBILE_NAV,
  HEADER_NAV_LABEL,
  NAV_LINKS,
} from "@/content/home/chrome";
import { Button } from "@/components/ui/button";
import { AccessLink } from "./access-link";
import { Wordmark } from "./wordmark";

function navCloseDelay(): number {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-duration-base")
    .trim();
  const amount = raw.endsWith("ms") ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
  return Number.isFinite(amount) ? Math.round(amount * 0.8) : 224;
}

/** The tone of the content behind the middle of the capsule's label row, or null when
 * it cannot tell (hit-testing unavailable, or nothing but the header itself at the probe point). */
function toneBeneath(header: HTMLElement): "light" | "dark" | null {
  try {
    // The label row, not the whole capsule: the open menu sheet grows the capsule downwards.
    const row = (header.querySelector(".glass > div") ?? header).getBoundingClientRect();
    const probeY = row.top + row.height / 2;
    const under = document
      .elementsFromPoint(window.innerWidth / 2, probeY)
      .find((el) => !header.contains(el));
    if (!under) return null;
    return under.closest('.plate-surface, [data-surface="dark"]') ? "dark" : "light";
  } catch {
    // Engines without hit-testing (jsdom, some embedded webviews) keep the current tone.
    return null;
  }
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    // Liquid Glass adapts to what scrolls beneath it: over a dark plate or the footer the capsule turns
    // to dark glass and the reversed wordmark, so it never floats as a pale slab on dark content.
    const sync = () => {
      header.toggleAttribute("data-scrolled", window.scrollY > 8);
      const tone = toneBeneath(header);
      if (tone && header.dataset.tone !== tone) header.dataset.tone = tone;
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Publish the header's real height for scroll-padding (globals.css): its rows wrap at widths no
    // breakpoint can predict, and a wrapped header would otherwise cover anchors and focus. The open
    // menu sheet is left out: choosing a link hides it before the anchor scroll, and it closes on Escape
    // and when focus leaves the header, so nothing scrolled into view ever lands under it. The tone is
    // re-probed because a height change moves the capsule.
    const root = document.documentElement;
    let published = "";
    const sizes =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(([entry]) => {
            const box = entry?.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight;
            const sheet = header.querySelector<HTMLElement>("#mobile-sections");
            const sheetHeight = sheet && !sheet.hidden ? sheet.getBoundingClientRect().height : 0;
            const value = `${Math.ceil(box - sheetHeight)}px`;
            if (value !== published) {
              published = value;
              root.style.setProperty("--header-h", value);
            }
            onScroll();
          })
        : null;
    sizes?.observe(header);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      sizes?.disconnect();
      root.style.removeProperty("--header-h");
    };
  }, []);

  // The open sheet covers the top of the page, so it closes before focus can move under it (Tab past
  // its last link) and on Escape, which hands focus back to the Menu button.
  useEffect(() => {
    const header = headerRef.current;
    if (!open || !header) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      header.querySelector<HTMLElement>('[aria-controls="mobile-sections"]')?.focus();
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !header.contains(next)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    header.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      header.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  useEffect(() => {
    if (open || !present) return;
    const id = window.setTimeout(() => setPresent(false), navCloseDelay());
    return () => window.clearTimeout(id);
  }, [open, present]);

  const close = () => setOpen(false);
  // Choosing a section navigates at once: the sheet is hidden in the same task, before the browser
  // scrolls to the anchor. Left in flow for the fade, it would make the header sheet-tall for that
  // scroll, and the section would end up the sheet's height past the header once it collapsed.
  const choose = () => {
    flushSync(() => {
      setOpen(false);
      setPresent(false);
    });
  };
  const toggle = () => {
    if (open) close();
    else {
      setPresent(true);
      setOpen(true);
    }
  };

  return (
    <header
      ref={headerRef}
      data-site-header
      data-tone="light"
      className="pointer-events-none sticky top-0 z-40 isolate min-h-[var(--size-header)] px-2 pt-2 md:px-6"
    >
      {/* Liquid Glass navigation layer: one floating capsule. Its 1.75rem radius is half its single-row
          height, so it reads as a capsule; when it wraps or opens the menu it becomes a rounded sheet with
          the same corner, and the pill controls inside sit concentric with it. Only the capsule takes
          pointer input: the clear gutters around it pass clicks through to the content they show. */}
      <div className="glass pointer-events-auto mx-auto max-w-[83rem] rounded-[1.75rem]">
        <div className="flex min-h-[calc(var(--size-header)-0.5rem-2px)] w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1 pr-1.5 pl-4 md:pl-6">
          <Wordmark tone="adaptive" priority viewTransition />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4">
            <nav
              aria-label={HEADER_NAV_LABEL.text}
              className="hidden items-center gap-1 lg:gap-2 md:flex"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
                >
                  {link.block.text}
                </a>
              ))}
            </nav>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 min-w-11 px-2 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-sections"
              onClick={toggle}
            >
              {HEADER_MENU.text}
            </Button>
            <Button
              asChild
              variant="ghost"
              className="min-h-11 px-2 text-sm font-normal text-fg-muted hover:bg-fg/[0.06] hover:text-fg hover:no-underline sm:px-3 sm:text-base"
            >
              <a href={AVELOZ_LINK.href} rel="noopener" aria-label={AVELOZ_LINK.block.text}>
                {AVELOZ_LINK.short.text}
                <span className="sr-only sm:not-sr-only">{AVELOZ_LINK.suffix.text}</span>
              </a>
            </Button>
            <AccessLink variant="secondary" className="min-h-11 px-3 text-sm sm:px-4 sm:text-base">
              {ACCESS_LABEL.text}
            </AccessLink>
          </div>
        </div>
        <nav
          id="mobile-sections"
          aria-label={HEADER_MOBILE_NAV.text}
          hidden={!present}
          // While it fades out the closing sheet is invisible, so it takes no taps and no focus.
          inert={!open}
          data-open={open ? "true" : "false"}
          className="mobile-sections border-t border-fg/10 md:hidden"
        >
          <div className="flex flex-col gap-1 px-4 py-3 md:px-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2 text-fg transition-colors hover:bg-fg/[0.06] active:bg-fg/[0.1]"
                onClick={choose}
              >
                {link.block.text}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
