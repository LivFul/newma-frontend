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
    <footer className="mt-auto bg-deep text-plate-fg px-5 md:px-12">
      <div className="grid w-full gap-10 py-12 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Wordmark imageClassName="h-auto w-36 sm:h-10 sm:w-auto brightness-0 invert" />
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
          <ul role="list" className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm text-plate-muted underline hover:text-plate-fg"
                >
                  {link.block.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
