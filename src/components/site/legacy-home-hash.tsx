"use client";

import { useEffect } from "react";

const HASH_ROUTES: Readonly<Record<string, string>> = Object.freeze({
  product: "/overview",
  workflow: "/how-it-works",
  components: "/ecosystem",
  about: "/about",
  closing: "/overview#closing",
});

/** Sends legacy homepage fragment bookmarks to their dedicated routes. */
export function LegacyHomeHashRedirect() {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    const target = HASH_ROUTES[raw];
    if (!target) return;
    window.location.replace(target);
  }, []);
  return null;
}
