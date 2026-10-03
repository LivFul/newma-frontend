"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { switchPersona } from "@/lib/demo/persona-client";
import { TOUR_STEPS, isDemoStepRoute } from "@/lib/demo/tour/steps";
import { personaLabel, type PersonaId } from "@/lib/personas";

type Props = Readonly<{
  index: number;
  persona: PersonaId;
  done: boolean;
  onToggleDone: () => void;
  /** Reset and end controls sit beside the card actions in the panel. */
  children?: React.ReactNode;
}>;

const openLabel = (workflow: string): string =>
  workflow === "Home" ? "Open homepage" : `Open ${workflow}`;

const LINK_CLASS = "inline-flex min-h-8 items-center underline underline-offset-4";

/** The current step: what to try, what to expect, and the persona and page actions. */
export function TourStepCard({ index, persona, done, onToggleDone, children }: Props) {
  const router = useRouter();
  const titleId = useId();
  const titleRef = useRef<HTMLParagraphElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const [switching, setSwitching] = useState(false);
  const step = TOUR_STEPS[index]!;
  const needsSwitch = step.persona !== null && step.persona !== persona;

  const switchTo = async (target: PersonaId) => {
    if (switching) return;
    setError(undefined);
    setSwitching(true);
    const ok = await switchPersona(target);
    setSwitching(false);
    if (!ok) {
      setError("Could not switch persona. Try again.");
      switchRef.current?.focus();
      return;
    }
    setAnnouncement(`Now acting as ${personaLabel(target)}.`);
    router.refresh();
    // The switch button unmounts once the persona matches: keep focus inside the card.
    titleRef.current?.focus();
  };

  return (
    <div role="group" aria-labelledby={titleId} className="space-y-3" data-testid="tour-step">
      <p id={titleId} ref={titleRef} tabIndex={-1} className="text-lg font-semibold">
        Step {index + 1}: {step.title}
      </p>
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
          <Button
            ref={switchRef}
            size="sm"
            aria-disabled={switching || undefined}
            onClick={() => void switchTo(step.persona!)}
          >
            Switch to {personaLabel(step.persona)}
          </Button>
        ) : null}
        {isDemoStepRoute(step.route) ? (
          <Link href={step.route} className={LINK_CLASS}>
            {openLabel(step.workflow)}
          </Link>
        ) : (
          <a href={step.route} className={LINK_CLASS}>
            {openLabel(step.workflow)}
          </a>
        )}
        <Button variant="secondary" size="sm" aria-pressed={done} onClick={onToggleDone}>
          Mark step done
        </Button>
        {done ? <span className="text-sm font-medium">Step done</span> : null}
        {children}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
