// Vercel protection-bypass headers must reach the preview origin only, never third parties.
export const BYPASS_HEADER_NAMES = ["x-vercel-protection-bypass", "x-vercel-set-bypass-cookie"];

export function isSameOrigin(url: string, baseURL: string): boolean {
  try {
    return new URL(url).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}

export function stripBypassHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !BYPASS_HEADER_NAMES.includes(name.toLowerCase())),
  );
}
