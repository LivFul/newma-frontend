"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { isRecord } from "@/lib/demo/guards";
import { useStableKey } from "@/lib/demo/idempotency";
import type { Job } from "@/lib/demo/jobs";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";
import { SimulatedLabel } from "../../_components/simulated-label";

const PROBE_CREDITS = 10;

type Outcome =
  Readonly<{ kind: "started"; jobId: string }> | Readonly<{ kind: "failed"; error: ClientError }>;

function QuotaRefusal({ details }: { details: Record<string, unknown> }) {
  return (
    <div role="alert" className="space-y-1 rounded-md border border-danger p-4 text-sm">
      <p>
        Refused: <span className="font-mono">quota_exhausted</span>. No job was created.
      </p>
      <ul className="list-disc pl-5">
        <li>Quota: {String(details.credit_quota)} demo credits</li>
        <li>Committed: {String(details.committed)} demo credits</li>
        <li>Requested: {String(details.requested)} demo credits</li>
        <li>Remaining: {String(details.remaining)} demo credits</li>
      </ul>
    </div>
  );
}

const isQuotaRefusal = (error: ClientError) =>
  error.code === "quota_exhausted" && isRecord(error.details);

/** Any persona can start a probe job to see the quota decide. */
export function JobProbe() {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [outcome, setOutcome] = useState<Outcome | undefined>();
  const { busy, run } = useAction();

  const start = () => {
    if (busy) return;
    void run(async () => {
      const response = await postJson<Job>("/api/demo/jobs", {
        kind: "screening",
        payload: { estimated_credits: PROBE_CREDITS },
        idempotency_key: key,
      });
      if (response.ok) {
        reset();
        setOutcome({ kind: "started", jobId: response.data.id });
      } else {
        if (response.status >= 400 && response.status < 500) reset();
        setOutcome({ kind: "failed", error: response.error });
      }
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="probe-heading" className="space-y-3">
      <h2 id="probe-heading" className="flex flex-wrap items-center gap-2 text-xl font-semibold">
        Job probe <SimulatedLabel label="Simulated compute" />
      </h2>
      <p className="text-sm text-fg-muted">
        Starts a simulated job that reserves {PROBE_CREDITS} demo credits. When the quota is used up
        the job is refused and nothing is created.
      </p>
      <Button type="button" onClick={start} aria-busy={busy || undefined}>
        Start a simulated screening job, {PROBE_CREDITS} demo credits
      </Button>
      {outcome?.kind === "started" ? (
        <p role="status" className="text-sm">
          Job started.{" "}
          <Link
            href={`/demo/jobs/${encodeURIComponent(outcome.jobId)}`}
            className="underline underline-offset-4"
          >
            Open the job ({outcome.jobId})
          </Link>
        </p>
      ) : null}
      {outcome?.kind === "failed" && isQuotaRefusal(outcome.error) ? (
        <QuotaRefusal details={outcome.error.details as Record<string, unknown>} />
      ) : null}
      {outcome?.kind === "failed" && !isQuotaRefusal(outcome.error) ? (
        <ErrorNotice error={outcome.error} />
      ) : null}
    </section>
  );
}
