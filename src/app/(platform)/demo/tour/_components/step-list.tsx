import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { personaLabel } from "@/lib/personas";

/** The tour script as a plain list, readable without starting the tour. */
export function StepList() {
  return (
    <section aria-labelledby="steps-heading" className="space-y-3">
      <h2 id="steps-heading" className="text-xl font-semibold">
        The steps
      </h2>
      <ol aria-label="Tour steps" className="list-decimal space-y-2 pl-6">
        {TOUR_STEPS.map((step) => (
          <li key={step.id}>
            <span className="font-medium">{step.title}</span>{" "}
            <span className="text-fg-muted">
              ({step.workflow}, {step.persona ? personaLabel(step.persona) : "any persona"}, about{" "}
              {step.minutes} minutes)
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
