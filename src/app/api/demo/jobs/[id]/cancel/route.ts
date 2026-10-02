import type { NextRequest } from "next/server";
import { demoFetch } from "@/lib/demo/api";
import { errorJson, isSafeId, noStore, withSession } from "@/lib/demo/bff";
import type { Job } from "@/lib/demo/jobs";

type Context = { params: Promise<{ id: string }> };

/** POST: cancel a job; a 409 job_terminal envelope passes through. */
export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isSafeId(id)) return errorJson(400, "invalid_job_id", "Invalid job id.");
  return withSession(async ({ sessionId }) => {
    const { data } = await demoFetch<Job>(`/v1/jobs/${id}/cancel`, { method: "POST", sessionId });
    return noStore(data);
  })(req);
}
