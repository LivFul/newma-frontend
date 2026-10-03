// Path-segment ids (UUIDs, display ids such as DEMO-C-001): client-safe so parsers can share it.
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function isSafeId(value: string): boolean {
  return SAFE_ID.test(value);
}
