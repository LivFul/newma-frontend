"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  AVELOZ_LINK,
  HEADER_MENU,
  HERO_MIRROR_LINKS,
  HEADER_MOBILE_NAV,
  NAV_LINKS,
  PLATFORM_CTA,
  THEME_GROUP_LABEL,
} from "@/content/home/chrome";
import { AccessLink } from "./access-link";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

const MOBILE_SECTIONS_ID = "mobile-sections";

function MenuMark({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex size-12 items-center justify-center rounded-full bg-[#1b2a1a] text-white shadow-[0_8px_24px_-12px_rgb(27_42_26_/_0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border forced-colors:border-[ButtonText] forced-colors:bg-[ButtonText] forced-colors:text-[ButtonFace]"
      aria-expanded={open}
      aria-controls={MOBILE_SECTIONS_ID}
      onClick={onClick}
    >
      <span className="sr-only">{HEADER_MENU.text}</span>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M3 4.5h12M3 9h12M3 13.5h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

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
    const row = (header.querySelector("[data-header-row]") ?? header).getBoundingClientRect();
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
  // Re-runs the scroll/tone sync on the next frame; set once the sync effect has mounted.
  const resyncRef = useRef<() => void>(() => undefined);
  const pathname = usePathname();
  // A navigation closes the sheet at once. The header persists across routes, and a link inside it
  // (the wordmark) keeps focus in the header, so neither a section choice nor focusout would close it.
  const [shownPath, setShownPath] = useState(pathname);
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setOpen(false);
    setPresent(false);
  }

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
    resyncRef.current = onScroll;
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
            // The menu sheet is position:absolute, so it never enters this border box.
            const value = `${Math.ceil(box)}px`;
            if (value !== published) {
              published = value;
              root.style.setProperty("--header-h", value);
            }
            onScroll();
          })
        : null;
    sizes?.observe(header);
    return () => {
      resyncRef.current = () => undefined;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      sizes?.disconnect();
      root.style.removeProperty("--header-h");
    };
  }, []);

  // A client-side navigation swaps the content beneath the capsule without a scroll or resize.
  useEffect(() => {
    resyncRef.current();
  }, [pathname]);

  // The open sheet covers the top of the page, so it closes before focus can move under it (Tab past
  // its last link) and on Escape, which hands focus back to the Menu button.
  useEffect(() => {
    const header = headerRef.current;
    if (!open || !header) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      header.querySelector<HTMLElement>(`[aria-controls="${MOBILE_SECTIONS_ID}"]`)?.focus();
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
      className="pointer-events-none sticky top-0 z-40 isolate min-h-[var(--size-header)] px-5 pt-4 md:px-12"
    >
      {/* Issued frame: the wordmark and one round menu. The clear gutters pass clicks through. */}
      <div
        data-header-row
        className="mx-auto flex w-full max-w-[86rem] items-center justify-between gap-4"
      >
        <div className="pointer-events-auto">
          <Wordmark tone="adaptive" priority viewTransition imageClassName="h-5 w-auto sm:h-7" />
        </div>
        <div className="pointer-events-auto relative">
          <MenuMark open={open} onClick={toggle} />
          <nav
            id={MOBILE_SECTIONS_ID}
            aria-label={HEADER_MOBILE_NAV.text}
            hidden={!present}
            // While it fades out the closing sheet is invisible, so it takes no taps and no focus.
            inert={!open}
            data-open={open ? "true" : "false"}
            className="mobile-sections glass absolute top-[calc(100%+0.75rem)] right-0 z-50 flex w-[min(18.5rem,calc(100vw-2.5rem))] flex-col gap-1 rounded-[1.5rem] p-3"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-fg transition-colors hover:bg-fg/[0.06] active:bg-fg/[0.1]"
                onClick={choose}
              >
                {link.block.text}
              </a>
            ))}
            <a
              href={AVELOZ_LINK.href}
              rel="noopener"
              className="inline-flex min-h-11 items-center rounded-full px-3 text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
              onClick={choose}
            >
              {HERO_MIRROR_LINKS.aveloz.text}
            </a>
            <AccessLink variant="secondary" className="min-h-11 justify-start px-3 text-base">
              {PLATFORM_CTA.text}
            </AccessLink>
            <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-full px-3">
              <span className="text-fg">{THEME_GROUP_LABEL.text}</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
