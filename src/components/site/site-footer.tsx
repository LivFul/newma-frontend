import Link from "next/link";
import {
  FOOTER_DESCRIPTOR,
  FOOTER_DISCLAIMER,
  FOOTER_LINKS,
  FOOTER_NAV_LABEL,
} from "@/content/home/chrome";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    // data-tone picks the reversed lockup on screen only; print and a light forced-colours canvas keep
    // the dark-ink one, which the reversed (white) lockup would vanish against (globals.css).
    <footer
      data-site-footer
      data-surface="dark"
      data-tone="dark"
      className="mt-auto bg-deep text-plate-fg px-5 md:px-12"
    >
      <div className="grid w-full gap-10 py-12 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="pb-4">
            <Wordmark lockup="logo" tone="adaptive" imageClassName="h-14 w-auto" />
          </div>
          <p className="max-w-[68ch] text-sm leading-relaxed text-plate-muted">
            {FOOTER_DESCRIPTOR.text}
          </p>
          <p className="max-w-[68ch] text-sm leading-relaxed text-plate-muted">
            {FOOTER_DISCLAIMER.text}
          </p>
        </div>
        <nav
          aria-label={FOOTER_NAV_LABEL.text}
          className="flex flex-col items-start gap-4 md:items-end"
        >
          <ul role="list" className="flex max-w-full flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={`${link.href}-${link.block.id}`}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 max-w-full items-center text-sm text-plate-muted underline hover:text-plate-fg [overflow-wrap:anywhere]"
                  >
                    {link.block.text}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 max-w-full items-center text-sm text-plate-muted underline hover:text-plate-fg [overflow-wrap:anywhere]"
                  >
                    {link.block.text}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
