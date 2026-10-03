import { track } from "@vercel/analytics";
import { isEcosystemSlug, type EcosystemSlug } from "@/content/ecosystem/registry";

// Exactly two events exist (D-07, assumption A-P4-12), cookieless, carrying no personal data:
// access_newma_click (no properties) and component_open ({ slug } only).
export type AnalyticsEvent =
  { name: "access_newma_click" } | { name: "component_open"; slug: EcosystemSlug };

/** DOM event dispatched on window for every emission; what the tests observe. */
export const EVENT_NAME = "newma:analytics";

const ACCESS = "access_newma_click";
const OPEN = "component_open";

/** Reporting needs a production Vercel deployment and a real browser, never automation. */
export function reportingEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
    typeof navigator !== "undefined" &&
    !navigator.webdriver
  );
}

function validate(event: AnalyticsEvent): void {
  const extra = Object.keys(event).filter((key) => key !== "name" && key !== "slug");
  if (event.name !== ACCESS && event.name !== OPEN) {
    throw new Error(`Unknown analytics event "${String((event as { name: unknown }).name)}".`);
  }
  if (extra.length > 0 || (event.name === ACCESS && "slug" in event)) {
    throw new Error(`Unexpected properties on analytics event "${event.name}".`);
  }
  if (event.name === OPEN && !isEcosystemSlug(String(event.slug))) {
    throw new Error(`Unknown component slug "${String(event.slug)}".`);
  }
}

export function trackEvent(event: AnalyticsEvent): void {
  try {
    validate(event);
  } catch (error) {
    // A bad event is a programming error: loud in development and tests, silent in production.
    if (process.env.NODE_ENV === "production") return;
    throw error;
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
  if (!reportingEnabled()) return;
  if (event.name === OPEN) track(OPEN, { slug: event.slug });
  else track(ACCESS);
}
