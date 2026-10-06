"use client";

import { useState } from "react";
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

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 min-h-[var(--size-header)] border-b border-fg/10 bg-bg/80 backdrop-blur-md"
    >
      <div className="flex min-h-[var(--size-header)] w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-1 md:px-12">
        <Wordmark priority />
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4">
          <nav aria-label={HEADER_NAV_LABEL.text} className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-fg-muted decoration-capsule decoration-2 hover:text-fg hover:underline"
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
            onClick={() => setOpen((value) => !value)}
          >
            {HEADER_MENU.text}
          </Button>
          <Button asChild variant="ghost" className="min-h-11 px-2 text-sm sm:px-3 sm:text-base">
            <a href={AVELOZ_LINK.href} rel="noopener" aria-label={AVELOZ_LINK.block.text}>
              {AVELOZ_LINK.short.text}
              <span className="sr-only sm:not-sr-only">{AVELOZ_LINK.suffix.text}</span>
            </a>
          </Button>
          <AccessLink variant="primary" className="min-h-11 px-3 text-sm sm:px-4 sm:text-base">
            {ACCESS_LABEL.text}
          </AccessLink>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-sections"
          aria-label={HEADER_MOBILE_NAV.text}
          className="flex flex-col gap-1 border-t border-fg/10 px-5 py-3 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-fg"
              onClick={() => setOpen(false)}
            >
              {link.block.text}
            </a>
          ))}
        </nav>
      ) : (
        <nav
          id="mobile-sections"
          hidden
          className="md:hidden"
          aria-label={HEADER_MOBILE_NAV.text}
        />
      )}
    </header>
  );
}
