"use client";

import { Analytics } from "@vercel/analytics/next";
import { useSyncExternalStore } from "react";
import { reportingEnabled } from "@/lib/analytics/events";

const subscribe = () => () => {};
const serverSnapshot = () => false;

// Cookieless Vercel Web Analytics, mounted by the (site) layout only: demo URLs carry session-scoped
// paths and never load it. It stays off outside production and under automation, so test runs and
// previews send nothing (assumption A-P4-12). The server snapshot is false, so the first client
// render matches the server and the component mounts after hydration.
export function AnalyticsMount() {
  const enabled = useSyncExternalStore(subscribe, reportingEnabled, serverSnapshot);
  return enabled ? <Analytics /> : null;
}
