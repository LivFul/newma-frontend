"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A region that scrolls sideways has to be reachable by keyboard, or its content is out of reach. But
// a tall region that does not scroll should not be a tab stop at all: focusing a diagram a thousand
// pixels tall scrolls its top edge under the sticky header (WCAG 2.4.11). So the region is a tab stop
// by default (correct without JavaScript, and on narrow screens) and drops out of the tab order once
// it is measured to fit.
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
      region.tabIndex = region.scrollWidth > region.clientWidth ? 0 : -1;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} role="region" aria-label={label} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
