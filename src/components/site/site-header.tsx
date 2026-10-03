import Link from "next/link";
import { ACCESS_LABEL, HEADER_NAV_LABEL, NAV_LINKS } from "@/content/home/chrome";
import { AccessLink } from "./access-link";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 min-h-[var(--size-header)] border-b border-border bg-bg"
    >
      <div className="mx-auto flex min-h-[var(--size-header)] max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Wordmark />
        <div className="flex items-center gap-6">
          <nav aria-label={HEADER_NAV_LABEL.text} className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-fg-muted underline-offset-4 hover:text-fg hover:underline"
              >
                {link.block.text}
              </Link>
            ))}
          </nav>
          <AccessLink variant="primary" className="min-h-11 whitespace-nowrap">
            {ACCESS_LABEL.text}
          </AccessLink>
        </div>
      </div>
    </header>
  );
}
