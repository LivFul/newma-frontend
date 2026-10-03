"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/events";

type AccessLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size">;

// The destination is a plain string, so the homepage keeps no dependency on demo code (isolation
// guard) and never builds a query string (open-redirect rule). className goes to Button so the size
// and the caller's classes merge instead of both landing on the anchor.
export function AccessLink({
  variant = "primary",
  size,
  className,
  children,
  ...rest
}: AccessLinkProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link {...rest} href="/access" onClick={() => trackEvent({ name: "access_newma_click" })}>
        {children}
      </Link>
    </Button>
  );
}
