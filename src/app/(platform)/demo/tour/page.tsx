import { requireSession } from "@/lib/demo/current-session";
import { tourMinutes } from "@/lib/demo/tour/steps";
import { ResetButton } from "../_components/reset-button";
import { SpeedControl } from "./_components/speed-control";
import { StartTour } from "./_components/start-tour";
import { StepList } from "./_components/step-list";

export default async function TourPage() {
  const session = await requireSession();
  return (
    <>
      <section aria-labelledby="tour-heading" className="space-y-3">
        <h1 id="tour-heading" className="text-2xl font-semibold">
          Guided tour
        </h1>
        <p className="text-fg-muted">
          An optional walk through workflows W1 to W10 across the personas, in about{" "}
          {Math.round(tourMinutes())} minutes. A panel above each page names the persona to act as,
          the control to try and the outcome to expect. Nothing blocks the next step, and you can
          leave and come back.
        </p>
        <StartTour tenantId={session.tenant_id} />
      </section>
      <section aria-labelledby="reset-heading" className="space-y-3">
        <h2 id="reset-heading" className="text-xl font-semibold">
          Start from the seed
        </h2>
        <p className="text-fg-muted">
          Resetting returns your demo tenant to its synthetic seed, so the steps reproduce their
          outcomes.
        </p>
        <ResetButton />
      </section>
      <SpeedControl />
      <StepList />
    </>
  );
}
