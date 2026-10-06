import type { ReactNode } from "react";
import { PwaGate } from "@/components/pwa/pwa-gate";
import { AnalyticsMount } from "@/components/site/analytics-mount";
import { RevealRoot } from "@/components/site/reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Header and footer are siblings of <main>, so they expose banner and contentinfo landmarks. The skip
// link lives in the root layout and stays the first tab stop, above the header (z-50 over z-40).
// The PWA worker and its install/update card mount here, not in the root layout, so they never
// appear over the session-bound /demo and /access pages (a Reload there would wipe a demo form).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <AnalyticsMount />
      <RevealRoot />
      <PwaGate />
    </>
  );
}
