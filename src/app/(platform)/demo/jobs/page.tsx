import Link from "next/link";
import { Badge } from "@/components/ui";
import { demoFetch } from "@/lib/demo/api";
import type { Job } from "@/lib/demo/jobs";
import { requireSessionId } from "@/lib/demo/current-session";
import { JobStateBadge } from "./_components/job-state-badge";
import { StartJobForm } from "./_components/start-job-form";

async function listJobs(): Promise<readonly Job[]> {
  const sessionId = await requireSessionId();
  const { data } = await demoFetch<{ items: Job[] }>("/v1/jobs", { sessionId });
  return data?.items ?? [];
}

export default async function JobsPage() {
  const jobs = await listJobs();
  return (
    <>
      <section className="space-y-3">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
          Simulated jobs
          <Badge>Simulated workflow engine</Badge>
        </h1>
        <p className="text-fg-muted">
          Jobs run on a simulated workflow engine with simulated compute; progress and scores are
          synthetic.
        </p>
        <StartJobForm />
      </section>
      <section aria-labelledby="jobs-heading" className="space-y-3">
        <h2 id="jobs-heading" className="text-xl font-semibold">
          Recent jobs
        </h2>
        {jobs.length === 0 ? (
          <p className="text-fg-muted">No jobs yet.</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <Link
                  href={`/demo/jobs/${encodeURIComponent(job.id)}`}
                  className="font-mono text-sm underline-offset-4 hover:underline"
                >
                  {job.id}
                </Link>
                <span className="text-sm text-fg-muted">{job.kind}</span>
                <JobStateBadge state={job.state} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
