"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { resetTour } from "@/lib/demo/tour/state";
import { useTour } from "@/lib/demo/tour/use-tour";

/** Starts, or restarts, the tour for this tenant; the dock in the layout takes over from there. */
export function StartTour({ tenantId }: Readonly<{ tenantId: string }>) {
  const tour = useTour(tenantId);
  const startedHere = useRef(false);

  // "Start tour" is replaced by the progress line: focus follows it instead of dropping to <body>.
  const focusProgress = (node: HTMLParagraphElement | null) => {
    if (node && startedHere.current) {
      node.focus();
      startedHere.current = false;
    }
  };

  if (!tour.state) {
    return (
      <Button
        onClick={() => {
          tour.start();
          startedHere.current = true;
        }}
      >
        Start tour
      </Button>
    );
  }
  return (
    <div className="space-y-2">
      <p ref={focusProgress} tabIndex={-1} className="outline-none">
        Tour in progress: step {tour.state.current + 1} of {TOUR_STEPS.length}. The guided tour
        panel is above this page.
      </p>
      <Button variant="secondary" onClick={() => tour.update((s) => resetTour(s))}>
        Restart tour
      </Button>
    </div>
  );
}
