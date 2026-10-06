"use client";

import { useEffect } from "react";

// Matches the observer's bottom root margin: a section above this line is already revealed.
const VISIBLE_FRACTION = 0.92;

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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    for (const node of nodes) {
      // A section already on screen stays as the server painted it: hiding it now only to fade it back in
      // is a visible flash.
      const { top, bottom } = node.getBoundingClientRect();
      if (top < window.innerHeight * VISIBLE_FRACTION && bottom > 0) continue;
      node.classList.add("reveal-pending");
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
