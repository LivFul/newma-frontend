import { Button } from "@/components/ui/button";
import { ACCESS_LABEL, AVELOZ_LINK, HEADER_NAV_LABEL, NAV_LINKS } from "@/content/home/chrome";
import { AccessLink } from "./access-link";
import { Wordmark } from "./wordmark";

// Section links are plain anchors on purpose: a hash jump is a browser scroll that honours
// scroll-padding, whereas a client-side Link navigation clicked in the first moments after load
// scrolled to the wrong place in the production build.
export function SiteHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 min-h-[var(--size-header)] border-b border-border bg-bg"
    >
      <div className="mx-auto flex min-h-[var(--size-header)] max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-1 md:px-8">
        <Wordmark />
        <div className="flex items-center gap-4 sm:gap-6">
          <nav aria-label={HEADER_NAV_LABEL.text} className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-fg-muted underline-offset-4 hover:text-fg hover:underline"
              >
                {link.block.text}
              </a>
            ))}
          </nav>
          <Button asChild variant="ghost" className="min-h-11 px-2 text-sm sm:px-3 sm:text-base">
            {/* aria-label keeps accessible name exact since flex layout collapses the suffix span's leading space */}
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
    </header>
  );
}
