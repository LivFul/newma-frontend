import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/demo/current-session";
import { isDemoMode } from "@/lib/demo/mode";
import { DemoBanner } from "./_components/demo-banner";
import { DemoHeader } from "./_components/demo-header";

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
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-6">
        {children}
      </main>
    </div>
  );
}
