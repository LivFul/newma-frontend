"use client";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { resetTour } from "@/lib/demo/tour/state";
import { useTour } from "@/lib/demo/tour/use-tour";

/** Starts, or restarts, the tour for this tenant; the dock in the layout takes over from there. */
export function StartTour({ tenantId }: Readonly<{ tenantId: string }>) {
  const tour = useTour(tenantId);
  const total = TOUR_STEPS.length;
  if (!tour.state) {
    return (
      <div className="space-y-2">
        <Button onClick={tour.start}>Start tour</Button>
      </div>
    );
  }
  const current = tour.state.current + 1;
  return (
    <div className="space-y-2">
      <p role="status">
        Tour in progress: step {current} of {total}. The guided tour panel is above this page.
      </p>
      <Button variant="secondary" onClick={() => tour.update((s) => resetTour(s))}>
        Restart tour
      </Button>
    </div>
  );
}
