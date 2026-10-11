// Next.js App Router rejects in-flight client transitions when the user activates another link.
// Those AbortErrors are expected and not actionable bugs.
const NAVIGATION_ABORT = /Transition was skipped|Navigation aborted/i;

export function isBenignNavigationAbort(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error === "string") return NAVIGATION_ABORT.test(error);
  if (error instanceof Error) {
    if (error.name === "AbortError" && NAVIGATION_ABORT.test(error.message)) return true;
    return NAVIGATION_ABORT.test(error.message);
  }
  return NAVIGATION_ABORT.test(String(error));
}
