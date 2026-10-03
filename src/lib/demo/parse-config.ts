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

/** Select value that clears the tenant override (the server default applies). */
export const SERVER_DEFAULT_CHOICE = "server";

/**
 * Reads a speed choice from the speed control: "server" clears the override (null), a whole
 * number from 1 to 10 sets it; anything else is undefined (the control shows an error).
 */
export function parseSpeedChoice(choice: string): number | null | undefined {
  if (choice === SERVER_DEFAULT_CHOICE) return null;
  if (!/^\d{1,2}$/.test(choice)) return undefined;
  return parseConfigUpdate({ speed_factor: Number(choice) })?.speed_factor ?? undefined;
}
