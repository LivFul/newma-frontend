"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A region that scrolls sideways has to be reachable by keyboard, or its content is out of reach. But
// a tall region that does not scroll should not be a tab stop at all: focusing a diagram a thousand
// pixels tall scrolls its top edge under the sticky header (WCAG 2.4.11), and a region whose name says
// it scrolls sideways would be wrong. So the region is a named tab stop by default (correct without
// JavaScript, and on narrow screens) and becomes a plain container, with no role, name or tab stop,
// once it is measured to fit.
export function ScrollRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const region = ref.current;
    if (!region || typeof ResizeObserver === "undefined") return;
    const update = () => {
      // A box with no width has not been laid out (it is hidden), so there is nothing to measure yet.
      if (region.clientWidth === 0) return;
      if (region.scrollWidth > region.clientWidth) {
        region.setAttribute("role", "region");
        region.setAttribute("aria-label", label);
        region.tabIndex = 0;
      } else {
        region.removeAttribute("role");
        region.removeAttribute("aria-label");
        region.removeAttribute("tabindex");
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(region);
    return () => observer.disconnect();
  }, [label]);

  return (
    <div ref={ref} role="region" aria-label={label} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
