import { isRecord } from "./guards";

// Demo speed override body (Contract row 17): 1-10, or null to clear the tenant override.
export const MIN_SPEED = 1;
export const MAX_SPEED = 10;

export function parseConfigUpdate(body: unknown): { speed_factor: number | null } | undefined {
  if (!isRecord(body)) return undefined;
  const { speed_factor } = body;
  if (speed_factor === null) return { speed_factor: null };
  return typeof speed_factor === "number" &&
    Number.isFinite(speed_factor) &&
    speed_factor >= MIN_SPEED &&
    speed_factor <= MAX_SPEED
    ? { speed_factor }
    : undefined;
}
