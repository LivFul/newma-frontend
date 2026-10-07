import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WORDMARK } from "@/content/home/chrome";

type WordmarkProps = {
  href?: string;
  label?: string;
  /** Size classes. The lockup is wide, so phones use a fixed width and larger screens use height. */
  imageClassName?: string;
  priority?: boolean;
  /** Names the lockup for a cross-route view transition. Only one instance may opt in. */
  viewTransition?: boolean;
  children?: ReactNode;
};

// Official lockup (mark, "newma", "by LivFul Therapeutics"). The image is decorative: the link name
// is the accessible label.
export function Wordmark({
  href = "/",
  label = WORDMARK.homeLabel.text,
  imageClassName = "h-auto w-28 max-w-[min(100%,9rem)] sm:h-10 sm:w-auto sm:max-w-none",
  priority = false,
  viewTransition = false,
  children,
}: WordmarkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex min-h-11 min-w-0 items-center gap-2"
    >
      <Image
        src="/brand/logo-horizontal.png"
        alt=""
        width={871}
        height={156}
        priority={priority}
        className={imageClassName}
        style={viewTransition ? { viewTransitionName: "wordmark" } : undefined}
      />
      {children}
    </Link>
  );
}
