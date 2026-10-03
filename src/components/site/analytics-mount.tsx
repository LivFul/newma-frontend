"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { useSyncExternalStore } from "react";
import { reportingEnabled } from "@/lib/analytics/events";

const subscribe = () => () => {};
const NEVER_REPORTED = /^\/(demo|access)(\/|$)/;

// Defence in depth: the component is mounted in the (site) layout only, but a single-page navigation
// can keep the injected script alive on later pages. Drop anything from the demo or sign-in paths and
// strip query strings and hashes from every URL that is sent.
export const beforeSend: BeforeSend = (event) => {
  const url = new URL(event.url, "https://placeholder.invalid");
  if (NEVER_REPORTED.test(url.pathname)) return null;
  return {
    ...event,
    url: `${url.origin === "https://placeholder.invalid" ? "" : url.origin}${url.pathname}`,
  };
};
const serverSnapshot = () => false;

// Cookieless Vercel Web Analytics, mounted by the (site) layout only: demo URLs carry session-scoped
// paths and never load it. It stays off outside production and under automation, so test runs and
// previews send nothing (assumption A-P4-12). The server snapshot is false, so the first client
// render matches the server and the component mounts after hydration.
export function AnalyticsMount() {
  const enabled = useSyncExternalStore(subscribe, reportingEnabled, serverSnapshot);
  return enabled ? <Analytics beforeSend={beforeSend} /> : null;
}
