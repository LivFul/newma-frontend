import { demoFetch } from "@/lib/demo/api";
import { errorJson, noStore, readJson, withSession } from "@/lib/demo/bff";
import { type Job, parseJobRequest } from "@/lib/demo/jobs";

const REPLAY_HEADER = "Idempotent-Replayed";

/** GET: list the tenant's jobs. */
export const GET = withSession(async ({ sessionId }) => {
  const { data } = await demoFetch<{ items: Job[] }>("/v1/jobs", { sessionId });
  return noStore(data);
});

/** POST: create a simulated job; an idempotent replay keeps the backend's 200 + header. */
export const POST = withSession(async ({ req, sessionId }) => {
  const request = parseJobRequest(await readJson(req));
  if (!request) return errorJson(400, "invalid_job_request", "Invalid job request.");
  const { status, data, headers } = await demoFetch<Job>("/v1/jobs", {
    method: "POST",
    body: request,
    sessionId,
  });
  const response = noStore(data, { status });
  const replayed = headers.get(REPLAY_HEADER);
  if (replayed) response.headers.set(REPLAY_HEADER, replayed);
  return response;
});
