import Link from "next/link";
import { WORDMARK } from "@/content/home/chrome";

// Text wordmark (assumption A-P4-01): no brand asset exists yet.
export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label={WORDMARK.homeLabel.text}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-lg"
    >
      <span className="font-display">{WORDMARK.org.text}</span>
      <span aria-hidden="true" className="text-fg-muted">
        /
      </span>
      <span className="font-semibold tracking-tight">{WORDMARK.product.text}</span>
    </Link>
  );
}
