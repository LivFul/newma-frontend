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
    <footer className="mt-auto border-t border-border bg-bg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_auto] md:px-8">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-prose text-sm text-fg-muted">{FOOTER_DISCLAIMER.text}</p>
          <p className="text-sm text-fg-muted">{FOOTER_CONTACT.text}</p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <AccessLink variant="secondary" className="min-h-11">
            {ACCESS_LABEL.text}
          </AccessLink>
          <nav aria-label={FOOTER_NAV_LABEL.text} className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
              >
                {link.block.text}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
