import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoApiError } from "@/lib/demo/api";
import { isSafeId } from "@/lib/demo/bff";
import type { Job } from "@/lib/demo/jobs";
import { requireSessionFetch } from "@/lib/demo/current-session";
import { JobProgress } from "../_components/job-progress";

async function loadJob(id: string): Promise<Job | undefined> {
  try {
    const { data } = await requireSessionFetch<Job>(`/v1/jobs/${id}`);
    return data;
  } catch (error) {
    if (error instanceof DemoApiError && error.status === 404) return undefined;
    throw error;
  }
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSafeId(id)) notFound();
  const job = await loadJob(id);
  if (!job) notFound();
  return (
    <section className="space-y-4">
      <p>
        <Link href="/demo/jobs" className="text-sm underline underline-offset-4">
          ← All jobs
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">
        {job.kind} job <span className="font-mono text-base text-fg-muted">{job.id}</span>
      </h1>
      <JobProgress id={job.id} initial={job} />
    </section>
  );
}
