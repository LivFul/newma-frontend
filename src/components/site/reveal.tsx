"use client";

import { useEffect } from "react";

// The observer treats the bottom 8% of the viewport as outside it, and a section above that line is
// already revealed, so one constant drives both.
const BOTTOM_MARGIN = 0.08;
const REVEAL_THRESHOLD = 0.12;

/** IntersectionObserver scroll reveal for `[data-reveal]` sections. No extra wrappers. */
export function RevealRoot() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (nodes.length === 0) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      for (const node of nodes) node.classList.add("reveal-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("reveal-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: `0px 0px -${BOTTOM_MARGIN * 100}% 0px` },
    );
    // Read every position first, then write: interleaving them would force a layout per section. A
    // section already on screen stays as the server painted it, because hiding it only to fade it back
    // in is a visible flash.
    const visibleLine = window.innerHeight * (1 - BOTTOM_MARGIN);
    const hidden = nodes.filter((node) => {
      const { top, bottom } = node.getBoundingClientRect();
      return !(top < visibleLine && bottom > 0);
    });
    for (const node of hidden) {
      node.classList.add("reveal-pending");
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
