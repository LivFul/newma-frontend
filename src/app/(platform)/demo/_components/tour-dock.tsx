"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { PersonaId } from "@/lib/personas";
import { useTour } from "@/lib/demo/tour/use-tour";

// The dock lives in the demo layout, which every demo page shares (W10 has a weight budget,
// A-P5B-16 / A-P5B-F02): this bootstrap reads sessionStorage after mount and loads the panel,
// its step texts and its controls as a separate chunk only when a tour is active.
const TourPanel = dynamic(() => import("./tour-panel"), { ssr: false });

type Props = Readonly<{ tenantId: string; persona: PersonaId }>;

export function TourDock({ tenantId, persona }: Props) {
  const tour = useTour(tenantId);
  if (tour.state) return <TourPanel tour={tour} state={tour.state} persona={persona} />;
  if (!tour.discarded) return null;
  return (
    <aside aria-label="Guided tour" className="border-b border-border px-4 py-2 text-sm">
      <p role="status">
        The guided tour was reset because its progress belonged to a different demo session.{" "}
        <Link href="/demo/tour" className="underline underline-offset-4">
          Start the tour again
        </Link>{" "}
        <button type="button" onClick={tour.end} className="underline underline-offset-4">
          Dismiss
        </button>
      </p>
    </aside>
  );
}
