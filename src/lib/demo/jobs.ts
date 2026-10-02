// Job vocabulary shared by the BFF handlers, the polling hook and the jobs pages (RM §1.5 states).
export const JOB_KINDS = ["screening", "admet"] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATES = [
  "QUEUED",
  "RUNNING",
  "RETRYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "HELD",
] as const;
export type JobState = (typeof JOB_STATES)[number];

export const TERMINAL_STATES: ReadonlySet<JobState> = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

export function isTerminal(state: JobState): boolean {
  return TERMINAL_STATES.has(state);
}

export type Job = Readonly<{
  id: string;
  kind: JobKind;
  state: JobState;
  progress: number;
  attempts: number;
  max_attempts: number;
  result: unknown;
  error: unknown;
  cost_credits: number;
  budget_credits: number | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}>;

export type JobRequest = Readonly<{
  kind: JobKind;
  payload: Record<string, unknown>;
  idempotency_key: string;
  budget_credits?: number;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Validates an incoming job request at the BFF boundary; returns undefined when invalid. */
export function parseJobRequest(body: unknown): JobRequest | undefined {
  if (!isRecord(body)) return undefined;
  const { kind, payload, idempotency_key, budget_credits } = body;
  if (!JOB_KINDS.includes(kind as JobKind)) return undefined;
  if (!isRecord(payload)) return undefined;
  if (typeof idempotency_key !== "string" || idempotency_key.length === 0) return undefined;
  if (budget_credits !== undefined && typeof budget_credits !== "number") return undefined;
  const base = { kind: kind as JobKind, payload, idempotency_key };
  return budget_credits === undefined ? base : { ...base, budget_credits };
}
