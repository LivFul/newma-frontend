"use client";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { Job, JobRequest } from "@/lib/demo/jobs";

// "Start simulated screening": the idempotency key is minted per submit so a double click replays.
export function StartJobForm() {
  const router = useRouter();
  const checkboxId = useId();
  const [injectFailure, setInjectFailure] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const start = () => {
    setError(undefined);
    const request: JobRequest = {
      kind: "screening",
      payload: { inject_failure: injectFailure },
      idempotency_key: crypto.randomUUID(),
    };
    startTransition(async () => {
      const response = await fetch("/api/demo/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      }).catch(() => undefined);
      if (!response?.ok) {
        setError("Could not start the job. Try again.");
        return;
      }
      const job = (await response.json()) as Job;
      router.push(`/demo/jobs/${encodeURIComponent(job.id)}`);
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
      className="flex flex-wrap items-center gap-4 rounded-md border border-border p-4"
      aria-label="Start a simulated job"
    >
      <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm">
        <input
          id={checkboxId}
          type="checkbox"
          checked={injectFailure}
          onChange={(event) => setInjectFailure(event.target.checked)}
        />
        Inject one retried failure
      </label>
      <Button type="submit" disabled={pending}>
        Start simulated screening
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
