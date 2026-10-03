// Small type guards for validating JSON bodies and path segments at the BFF boundary.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const isPositiveInt = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 1;

/** A real calendar date in YYYY-MM-DD form. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const isBoundedString = (value: unknown, max: number): value is string =>
  isNonEmptyString(value) && value.length <= max;

export const isBoundedStringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number,
): value is string[] =>
  Array.isArray(value) &&
  value.length <= maxItems &&
  value.every((v) => isBoundedString(v, maxLength));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

export function oneOf<const T extends readonly string[]>(values: T) {
  const set: ReadonlySet<string> = new Set(values);
  return (value: unknown): value is T[number] => typeof value === "string" && set.has(value);
}

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,128}$/;
export const isIdempotencyKey = (value: unknown): value is string =>
  typeof value === "string" && IDEMPOTENCY_KEY.test(value);

/**
 * Keeps the client's stable key (so a double click replays) or mints one server-side when it is
 * absent; a malformed key is rejected (undefined).
 */
export function withIdempotencyKey<T extends Record<string, unknown>>(
  body: T,
): (T & { idempotency_key: string }) | undefined {
  const key = body.idempotency_key;
  if (key === undefined || key === null) return { ...body, idempotency_key: crypto.randomUUID() };
  return isIdempotencyKey(key) ? { ...body, idempotency_key: key } : undefined;
}

/** Copies only the listed keys whose values are defined. */
export function pick<T extends Record<string, unknown>, K extends string>(
  body: T,
  keys: readonly K[],
): Partial<Record<K, unknown>> {
  return Object.fromEntries(
    keys.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]),
  ) as Partial<Record<K, unknown>>;
}
