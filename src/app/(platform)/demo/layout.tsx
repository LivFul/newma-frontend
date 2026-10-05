import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/demo/current-session";
import { isDemoMode } from "@/lib/demo/mode";
import { DemoBanner } from "./_components/demo-banner";
import { DemoHeader } from "./_components/demo-header";
import { TourDock } from "./_components/tour-dock";
import { WorkflowRail } from "./_components/workflow-rail";
import "./demo.css";

export const metadata: Metadata = {
  title: "NEWMA demo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DemoLayout({ children }: { children: ReactNode }) {
  if (!isDemoMode()) notFound();
  const session = await requireSession();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DemoBanner />
      <DemoHeader session={session} />
      <TourDock tenantId={session.tenant_id} persona={session.persona} />
      <div className="flex flex-1 flex-col xl:flex-row">
        <WorkflowRail />
        <main
          id="main"
          tabIndex={-1}
          className="demo-workspace w-full min-w-0 flex-1 space-y-10 px-5 py-8 md:px-10 md:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
