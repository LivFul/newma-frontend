import { isRecord } from "./guards";

// Building blocks for the per-code `details` pickers (error-details.ts, error-details-p5b.ts):
// documented keys with the expected types, nothing else.
export type Picker = (details: unknown) => unknown;

export const isString = (value: unknown): value is string => typeof value === "string";

export function pickRecord(
  details: unknown,
  keys: Readonly<Record<string, (v: unknown) => boolean>>,
) {
  if (!isRecord(details)) return undefined;
  const picked: Record<string, unknown> = {};
  for (const [key, valid] of Object.entries(keys)) {
    if (!valid(details[key])) return undefined;
    picked[key] = details[key];
  }
  return picked;
}

export function pickReasons(value: unknown): unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const reasons: unknown[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isString(item.code)) return undefined;
    reasons.push({
      code: item.code,
      ...(isString(item.message) ? { message: item.message } : {}),
      ...(isString(item.remediation) || item.remediation === null
        ? { remediation: item.remediation }
        : {}),
    });
  }
  return reasons;
}
