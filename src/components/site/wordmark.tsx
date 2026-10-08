import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WORDMARK } from "@/content/home/chrome";

/**
 * Brand pack v1.0 lockups, cropped to their ink. `wordmark` is newmA alone, for tight spaces such as the
 * header (minimum 110px wide); `logo` adds the BY LIVFUL THERAPEUTICS byline (minimum 160px wide).
 * `light` is the primary colourway for Mist and white grounds; `dark` is the reversed one for Night.
 * Never recolour a lockup with filters: each ground has its own file.
 */
const LOCKUPS = {
  wordmark: {
    light: "/brand/newma-wordmark.svg",
    dark: "/brand/newma-wordmark-reversed.svg",
    width: 747,
    height: 105,
  },
  logo: {
    light: "/brand/newma-logo.svg",
    dark: "/brand/newma-logo-reversed.svg",
    width: 747,
    height: 174,
  },
} as const;

type WordmarkProps = {
  href?: string;
  label?: string;
  lockup?: keyof typeof LOCKUPS;
  /** `adaptive` ships both colourways and lets the nearest `[data-tone]` ancestor pick one. */
  tone?: "light" | "dark" | "adaptive";
  /** Size classes. Set a height; the width follows the lockup's ratio. */
  imageClassName?: string;
  priority?: boolean;
  /** Names the lockup for a cross-route view transition. Only one instance may opt in. */
  viewTransition?: boolean;
  children?: ReactNode;
};

// The image is decorative: the link name is the accessible label.
export function Wordmark({
  href = "/",
  label = WORDMARK.homeLabel.text,
  lockup = "wordmark",
  tone = "light",
  imageClassName = "h-6 w-auto sm:h-7",
  priority = false,
  viewTransition = false,
  children,
}: WordmarkProps) {
  const art = LOCKUPS[lockup];
  const image = (colourway: "light" | "dark", className = imageClassName, standby = false) => (
    <Image
      src={art[colourway]}
      alt=""
      width={art.width}
      height={art.height}
      priority={standby ? false : priority}
      // The hidden colourway of an adaptive lockup loads eagerly at low priority: a lazy image under
      // display:none is not fetched until shown, which would leave a blank slot on the first swap.
      loading={standby ? "eager" : undefined}
      fetchPriority={standby ? "low" : undefined}
      className={className}
    />
  );
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex min-h-11 min-w-0 items-center gap-2"
    >
      <span
        className="inline-flex"
        style={viewTransition ? { viewTransitionName: "wordmark" } : undefined}
      >
        {tone === "adaptive" ? (
          <>
            {image("light", `wordmark-light ${imageClassName}`)}
            {image("dark", `wordmark-dark ${imageClassName}`, true)}
          </>
        ) : (
          image(tone)
        )}
      </span>
      {children}
    </Link>
  );
}
