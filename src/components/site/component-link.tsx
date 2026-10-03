"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ecosystemHref, type EcosystemSlug } from "@/content/ecosystem/registry";
import { trackEvent } from "@/lib/analytics/events";

// Client wrapper only so the click can be counted: the link itself is a plain internal anchor.
export function ComponentLink({
  slug,
  className,
  children,
}: {
  slug: EcosystemSlug;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={ecosystemHref(slug)}
      className={className}
      onClick={() => trackEvent({ name: "component_open", slug })}
    >
      {children}
    </Link>
  );
}
