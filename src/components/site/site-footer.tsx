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

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-deep text-plate-fg px-5 md:px-12">
      <div className="grid w-full gap-10 py-12 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Wordmark imageClassName="h-auto w-36 sm:h-10 sm:w-auto brightness-0 invert" />
          <p className="max-w-[68ch] text-sm leading-relaxed text-plate-muted">
            {FOOTER_DISCLAIMER.text}
          </p>
          <p className="text-sm text-plate-muted">{FOOTER_CONTACT.text}</p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <AccessLink variant="secondary" className="min-h-11 border-plate-fg/40 text-plate-fg">
            {ACCESS_LABEL.text}
          </AccessLink>
          <nav aria-label={FOOTER_NAV_LABEL.text} className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-sm text-plate-muted underline hover:text-plate-fg"
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
