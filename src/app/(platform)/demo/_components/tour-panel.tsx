"use client";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { goTo, isComplete, markDone, resetTour, unmarkDone } from "@/lib/demo/tour/state";
import type { TourState } from "@/lib/demo/tour/state";
import type { UseTour } from "@/lib/demo/tour/use-tour";
import type { PersonaId } from "@/lib/personas";
import { ResetButton } from "./reset-button";
import { TourStepCard } from "./tour-step-card";

type Props = Readonly<{ tour: UseTour; state: TourState; persona: PersonaId }>;

const LAST = TOUR_STEPS.length - 1;

function StepList({ state, onGo }: Readonly<{ state: TourState; onGo: (index: number) => void }>) {
  return (
    <ol
      role="list"
      aria-label="Jump to a tour step"
      className="grid list-none gap-1 p-0 text-sm sm:grid-cols-2"
    >
      {TOUR_STEPS.map((step, index) => (
        <li key={step.id}>
          <button
            type="button"
            aria-current={index === state.current ? "step" : undefined}
            onClick={() => onGo(index)}
            className="min-h-8 w-full border-l-4 border-transparent pl-2 text-left underline-offset-4 hover:underline aria-[current=step]:border-accent aria-[current=step]:font-semibold"
          >
            {index + 1}. {step.title}
            {state.done.includes(step.id) ? (
              <span className="ml-2 text-xs font-medium">Done</span>
            ) : null}
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Ending the tour unmounts the panel: focus moves to the page's main region, not to <body>. */
function endTour(tour: UseTour): void {
  tour.end();
  document.getElementById("main")?.focus();
}

/** The expanded tour panel; loaded lazily by TourDock (see tour-dock.tsx). */
export default function TourPanel({ tour, state, persona }: Props) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const step = TOUR_STEPS[state.current]!;
  const complete = isComplete(state);
  // aria-disabled, not disabled: a pressed Previous must not drop keyboard focus.
  const go = (index: number) => {
    if (index >= 0 && index <= LAST) tour.update((s) => goTo(s, index));
  };

  return (
    <aside
      aria-label="Guided tour"
      className="space-y-3 border-b border-border bg-bg-elevated px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="font-medium">
          {`Guided tour, step ${state.current + 1} of ${TOUR_STEPS.length}: ${step.title}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-disabled={state.current === 0 || undefined}
            onClick={() => go(state.current - 1)}
          >
            Previous
          </Button>
          {state.current < LAST ? (
            <Button size="sm" onClick={() => go(state.current + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={() => endTour(tour)}>
              Finish tour
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            ref={toggleRef}
            aria-expanded={expanded}
            aria-controls={expanded ? bodyId : undefined}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
      <p role="status" className="sr-only">
        {complete ? "Tour complete: every step is done." : ""}
      </p>
      {expanded ? (
        <div id={bodyId} className="space-y-4">
          {complete ? (
            <p className="font-medium">
              Tour complete: every step is done. Restart it from step one or end the tour.
            </p>
          ) : null}
          <StepList state={state} onGo={go} />
          <TourStepCard
            index={state.current}
            persona={persona}
            done={state.done.includes(step.id)}
            onToggleDone={() =>
              tour.update((s) =>
                s.done.includes(step.id) ? unmarkDone(s, step.id) : markDone(s, step.id),
              )
            }
          >
            <ResetButton />
            {complete ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => tour.update((s) => resetTour(s))}
              >
                Restart tour
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => endTour(tour)}>
              End tour
            </Button>
          </TourStepCard>
        </div>
      ) : null}
    </aside>
  );
}
