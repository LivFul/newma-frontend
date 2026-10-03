"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { switchPersona } from "@/lib/demo/persona-client";
import { TOUR_STEPS, isDemoStepRoute } from "@/lib/demo/tour/steps";
import { personaLabel, type PersonaId } from "@/lib/personas";

type Props = Readonly<{
  index: number;
  persona: PersonaId;
  done: boolean;
  onMarkDone: () => void;
  /** The persona switch, the page link and the reset sit beside the card in the panel. */
  children?: React.ReactNode;
}>;

const openLabel = (workflow: string): string =>
  workflow === "Home" ? "Open homepage" : `Open ${workflow}`;

/** The current step: what to try, what to expect, and the persona and page actions. */
export function TourStepCard({ index, persona, done, onMarkDone, children }: Props) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [switching, setSwitching] = useState(false);
  const step = TOUR_STEPS[index]!;
  const needsSwitch = step.persona !== null && step.persona !== persona;

  const switchTo = async (target: PersonaId) => {
    setError(undefined);
    setSwitching(true);
    const ok = await switchPersona(target);
    setSwitching(false);
    if (!ok) return setError("Could not switch persona. Try again.");
    router.refresh();
    cardRef.current?.focus();
  };

  return (
    <div ref={cardRef} tabIndex={-1} className="space-y-3 outline-none" data-testid="tour-step">
      <h2 className="text-lg font-semibold">
        Step {index + 1}: {step.title}
      </h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-fg-muted">Persona</dt>
          <dd>{step.persona ? personaLabel(step.persona) : "Any"}</dd>
        </div>
        <div>
          <dt className="font-medium text-fg-muted">Time</dt>
          <dd>About {step.minutes} minutes</dd>
        </div>
        <div>
          <dt className="font-medium text-fg-muted">Control to try</dt>
          <dd>{step.tryIt}</dd>
        </div>
        <div>
          <dt className="font-medium text-fg-muted">Expected outcome</dt>
          <dd data-testid="tour-expected">{step.expected}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {needsSwitch && step.persona ? (
          <Button size="sm" disabled={switching} onClick={() => void switchTo(step.persona!)}>
            Switch to {personaLabel(step.persona)}
          </Button>
        ) : null}
        {isDemoStepRoute(step.route) ? (
          <Link href={step.route} className="underline underline-offset-4">
            {openLabel(step.workflow)}
          </Link>
        ) : (
          <a href={step.route} className="underline underline-offset-4">
            {openLabel(step.workflow)}
          </a>
        )}
        {done ? (
          <span className="text-sm font-medium">Step done</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={onMarkDone}>
            Mark step done
          </Button>
        )}
        {children}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
