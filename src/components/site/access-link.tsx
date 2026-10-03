"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/events";

type AccessLinkProps = Omit<ComponentProps<"a">, "href" | "onClick"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size">;

// A plain anchor to /access (never a query string, never a demo import): the destination is a string,
// so the homepage keeps no dependency on demo code (isolation guard).
export function AccessLink({ variant = "primary", size, children, ...rest }: AccessLinkProps) {
  return (
    <Button asChild variant={variant} size={size}>
      <a {...rest} href="/access" onClick={() => trackEvent({ name: "access_newma_click" })}>
        {children}
      </a>
    </Button>
  );
}
