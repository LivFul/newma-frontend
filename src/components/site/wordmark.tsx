import Link from "next/link";
import { WORDMARK } from "@/content/home/chrome";

// Text wordmark (assumption A-P4-01): no brand asset exists yet. The product name is lettered like a
// sheet title; the LivFul imprint sits before it.
export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label={WORDMARK.homeLabel.text}
      className="inline-flex min-h-11 items-center gap-2 text-base sm:text-lg"
    >
      <span className="font-normal">{WORDMARK.org.text}</span>
      <span aria-hidden="true" className="h-5 w-px bg-fg/40" />
      <span className="font-display font-semibold tracking-[0.12em]">{WORDMARK.product.text}</span>
    </Link>
  );
}
