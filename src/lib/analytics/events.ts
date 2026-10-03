import type { EcosystemSlug } from "@/content/ecosystem/registry";

// Exactly two events exist (D-07). The real dispatcher lands with the analytics task; callers import
// this stable surface now so tests can spy on it.
export type AnalyticsEvent =
  { name: "access_newma_click" } | { name: "component_open"; slug: EcosystemSlug };

export function trackEvent(event: AnalyticsEvent): void {
  void event;
}
