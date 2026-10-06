"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { WORKFLOWS } from "@/lib/demo/workflows";
import { cn } from "@/lib/cn";

const UTILITY_LINKS = Object.freeze([
  { href: "/demo/jobs", label: "Simulated jobs" },
  { href: "/demo/tour", label: "Guided tour" },
]);

// Drawn in the survey's linework: one stroke weight, square caps.
function SheetIcon() {
  return <LeafIcon className="size-4" gradient={false} />;
}
const isActive = (pathname: string, href: string): boolean =>
  href === "/demo" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

const ITEM =
  "flex min-h-11 items-center gap-3 rounded-full px-3 py-1.5 text-sm text-fg-muted transition-colors " +
  "hover:bg-bg-deep hover:text-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg forced-colors:aria-[current=page]:outline-2 forced-colors:aria-[current=page]:-outline-offset-2";

// The workflow legend, always in reach: W1–W10 as numbered keys down the sheet's left margin on wide
// screens, a scrolling strip of keys under the header on narrow ones. The strip is positioned so the
// visually hidden titles anchor to it; otherwise they sit against the page and widen the document.
export function WorkflowRail() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Demo sections"
      className="border-b border-border bg-bg xl:sticky xl:top-0 xl:h-dvh xl:w-64 xl:shrink-0 xl:overflow-y-auto xl:border-r xl:border-b-0"
    >
      <ul
        role="list"
        className="relative flex gap-1 overflow-x-auto px-3 py-2 xl:flex-col xl:gap-0.5 xl:overflow-visible xl:px-3 xl:py-6"
      >
        <li className="shrink-0">
          <Link
            href="/demo"
            aria-current={isActive(pathname, "/demo") ? "page" : undefined}
            className={ITEM}
          >
            <span className="w-8">
              <SheetIcon />
            </span>
            Dashboard
          </Link>
        </li>
        <li aria-hidden="true" className="hidden px-3 pt-5 pb-2 xl:block">
          <span className="place text-fg-muted">Workflows</span>
        </li>
        {WORKFLOWS.map((workflow) =>
          workflow.href ? (
            <li key={workflow.id} className="shrink-0">
              <Link
                href={workflow.href}
                aria-current={isActive(pathname, workflow.href) ? "page" : undefined}
                className={cn(ITEM, "whitespace-nowrap xl:whitespace-normal")}
              >
                <span className="w-8 shrink-0 font-mono text-xs">{workflow.id}</span>
                <span className="max-xl:sr-only">{workflow.title}</span>
              </Link>
            </li>
          ) : null,
        )}
        <li aria-hidden="true" className="hidden px-3 pt-5 pb-2 xl:block">
          <span className="block border-t border-fg/15" />
        </li>
        {UTILITY_LINKS.map((link) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(ITEM, "whitespace-nowrap")}
            >
              <span className="w-8 max-xl:hidden">
                <PillIcon className="size-4" gradient={false} />
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
