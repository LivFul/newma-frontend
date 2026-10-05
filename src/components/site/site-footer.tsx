import Link from "next/link";
import {
  ACCESS_LABEL,
  FOOTER_CONTACT,
  FOOTER_DISCLAIMER,
  FOOTER_LEGAL_LINKS,
  FOOTER_NAV_LABEL,
} from "@/content/home/chrome";
import { AccessLink } from "./access-link";
import { Wordmark } from "./wordmark";

// The sheet's colophon: imprint on the left, the exits on the right, under one heavy rule.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-fg bg-bg px-5 md:px-12">
      <div className="grid w-full gap-10 py-12 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-[68ch] text-sm leading-relaxed text-fg-muted">
            {FOOTER_DISCLAIMER.text}
          </p>
          <p className="text-sm text-fg-muted">{FOOTER_CONTACT.text}</p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <AccessLink variant="secondary" className="min-h-11">
            {ACCESS_LABEL.text}
          </AccessLink>
          <nav aria-label={FOOTER_NAV_LABEL.text} className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-sm text-fg-muted underline hover:text-fg"
              >
                {link.block.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
