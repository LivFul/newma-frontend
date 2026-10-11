// Next.js App Router and React view transitions abort in-flight work when the user navigates again
// or the browser skips the animation (visibility, viewport, skipTransition()). Not actionable.
const NAVIGATION_ABORT = /Transition was skipped|Navigation aborted|Skipping view transition/i;

export function isBenignNavigationAbort(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error === "string") return NAVIGATION_ABORT.test(error);
  if (error instanceof Error) {
    if (error.name === "AbortError" && NAVIGATION_ABORT.test(error.message)) return true;
    return NAVIGATION_ABORT.test(error.message);
  }
  return NAVIGATION_ABORT.test(String(error));
}
