import { isRecord } from "../guards";
import { TOUR_STEP_IDS, type TourStepId } from "./step-ids";

// Guided-tour progress (A-P5B-18): pure helpers over an immutable value. Persisted by use-tour.ts
// in sessionStorage only; the value holds no token and no session id.
export const TOUR_STORAGE_KEY = "newma.tour.v1";
export const TOUR_VERSION = 1;

/** `current` is the zero-based index of the step on screen; `done` keeps script order. */
export type TourState = Readonly<{
  version: typeof TOUR_VERSION;
  tenant_id: string;
  started_at: string;
  current: number;
  done: readonly TourStepId[];
}>;

export type DiscardReason = "malformed" | "version" | "tenant";
export type ParsedTour = Readonly<{ state?: TourState; discarded?: DiscardReason }>;

const LAST_STEP = TOUR_STEP_IDS.length - 1;
const STEP_IDS: ReadonlySet<string> = new Set(TOUR_STEP_IDS);

const freeze = (state: TourState): TourState =>
  Object.freeze({ ...state, done: Object.freeze([...state.done]) });

export function clampStep(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(LAST_STEP, Math.max(0, Math.trunc(index)));
}

export function startTour(tenantId: string, now: Date = new Date()): TourState {
  return freeze({
    version: TOUR_VERSION,
    tenant_id: tenantId,
    started_at: now.toISOString(),
    current: 0,
    done: [],
  });
}

export const goTo = (state: TourState, index: number): TourState =>
  freeze({ ...state, current: clampStep(index) });

export function markDone(state: TourState, id: TourStepId): TourState {
  if (state.done.includes(id)) return state;
  const done = TOUR_STEP_IDS.filter((stepId) => stepId === id || state.done.includes(stepId));
  return freeze({ ...state, done });
}

export const isComplete = (state: TourState): boolean => state.done.length === TOUR_STEP_IDS.length;

/** "Reset demo" inside the tour: the same tenant, back at step one with nothing done. */
export const resetTour = (state: TourState, now: Date = new Date()): TourState =>
  startTour(state.tenant_id, now);

export const serializeState = (state: TourState): string => JSON.stringify(state);

function readDone(value: unknown): TourStepId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((id): id is TourStepId => typeof id === "string" && STEP_IDS.has(id));
  return ids.length === value.length && new Set(ids).size === ids.length ? ids : undefined;
}

function validate(value: Record<string, unknown>, tenantId: string): ParsedTour {
  if (value.version !== TOUR_VERSION) {
    return { discarded: typeof value.version === "number" ? "version" : "malformed" };
  }
  const { tenant_id, started_at, current } = value;
  const done = readDone(value.done);
  if (
    typeof tenant_id !== "string" ||
    typeof started_at !== "string" ||
    Number.isNaN(Date.parse(started_at)) ||
    typeof current !== "number" ||
    !Number.isInteger(current) ||
    current < 0 ||
    current > LAST_STEP ||
    !done
  ) {
    return { discarded: "malformed" };
  }
  if (tenant_id !== tenantId) return { discarded: "tenant" };
  return { state: freeze({ version: TOUR_VERSION, tenant_id, started_at, current, done }) };
}

/** Defensive read: a malformed, foreign or other-version value is discarded, never trusted. */
export function parseState(raw: string | null, tenantId: string): ParsedTour {
  if (raw === null) return {};
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { discarded: "malformed" };
  }
  return isRecord(value) ? validate(value, tenantId) : { discarded: "malformed" };
}
