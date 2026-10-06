"use client";

import { useEffect } from "react";

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
      node.classList.add("reveal-pending");
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
