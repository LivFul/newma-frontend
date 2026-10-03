"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { goTo, isComplete, markDone, resetTour } from "@/lib/demo/tour/state";
import type { TourState } from "@/lib/demo/tour/state";
import type { UseTour } from "@/lib/demo/tour/use-tour";
import type { PersonaId } from "@/lib/personas";
import { ResetButton } from "./reset-button";
import { TourStepCard } from "./tour-step-card";

type Props = Readonly<{ tour: UseTour; state: TourState; persona: PersonaId }>;

const LAST = TOUR_STEPS.length - 1;

function StepList({ state, onGo }: Readonly<{ state: TourState; onGo: (index: number) => void }>) {
  return (
    <ol aria-label="Tour steps" className="grid list-none gap-1 p-0 text-sm sm:grid-cols-2">
      {TOUR_STEPS.map((step, index) => (
        <li key={step.id} className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-current={index === state.current ? "step" : undefined}
            onClick={() => onGo(index)}
            className="min-h-8 text-left underline-offset-4 hover:underline aria-[current=step]:font-semibold"
          >
            {index + 1}. {step.title}
          </button>
          {state.done.includes(step.id) ? <span className="text-xs font-medium">Done</span> : null}
        </li>
      ))}
    </ol>
  );
}

/** The expanded tour panel; loaded lazily by TourDock (see tour-dock.tsx). */
export default function TourPanel({ tour, state, persona }: Props) {
  const [expanded, setExpanded] = useState(false);
  const step = TOUR_STEPS[state.current]!;
  const go = (index: number) => tour.update((s) => goTo(s, index));

  return (
    <aside
      aria-label="Guided tour"
      className="space-y-3 border-b border-border bg-bg-elevated px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="font-medium">
          Guided tour, step {state.current + 1} of {TOUR_STEPS.length}: {step.title}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={state.current === 0}
            onClick={() => go(state.current - 1)}
          >
            Previous
          </Button>
          {state.current < LAST ? (
            <Button size="sm" onClick={() => go(state.current + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={tour.end}>
              Finish tour
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="space-y-4">
          {isComplete(state) ? (
            <p role="status" className="font-medium">
              Tour complete: every step is done. Restart it from step one or end the tour.
            </p>
          ) : null}
          <StepList state={state} onGo={go} />
          <TourStepCard
            index={state.current}
            persona={persona}
            done={state.done.includes(step.id)}
            onMarkDone={() => tour.update((s) => markDone(s, step.id))}
          >
            <ResetButton label="Reset demo" />
            {isComplete(state) ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => tour.update((s) => resetTour(s))}
              >
                Restart tour
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={tour.end}>
              End tour
            </Button>
          </TourStepCard>
        </div>
      ) : null}
    </aside>
  );
}
