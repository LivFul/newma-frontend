import type { components } from "@/lib/api/generated/schema";

// Job vocabulary shared by the BFF handlers, the polling hook and the jobs pages (RM §1.5 states).
// Types come from the generated P2 contract; the runtime arrays are checked against its enums in
// tests/unit/demo/contract.test.ts.
export type Job = components["schemas"]["JobRead"];
export type JobRequest = components["schemas"]["JobCreate"];
export type JobKind = Job["kind"];
export type JobState = Job["state"];

export const JOB_KINDS = ["screening", "admet"] as const satisfies readonly JobKind[];

export const JOB_STATES = [
  "QUEUED",
  "RUNNING",
  "RETRYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "HELD",
] as const satisfies readonly JobState[];

export const TERMINAL_STATES: ReadonlySet<JobState> = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

export function isTerminal(state: JobState): boolean {
  return TERMINAL_STATES.has(state);
}

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
  const base: JobRequest = { kind: kind as JobKind, payload, idempotency_key };
  return budget_credits === undefined ? base : { ...base, budget_credits };
}
