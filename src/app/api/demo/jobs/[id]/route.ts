import type { NextRequest } from "next/server";
import { demoFetch } from "@/lib/demo/api";
import { errorJson, isSafeId, noStore, withSession } from "@/lib/demo/bff";
import type { Job } from "@/lib/demo/jobs";

type Context = { params: Promise<{ id: string }> };

/** GET: one poll of a job. No streaming; returns at once with Cache-Control: no-store (D-10). */
export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isSafeId(id)) return errorJson(400, "invalid_job_id", "Invalid job id.");
  return withSession(async ({ sessionId }) => {
    const { data } = await demoFetch<Job>(`/v1/jobs/${id}`, { sessionId });
    return noStore(data);
  })(req);
}
