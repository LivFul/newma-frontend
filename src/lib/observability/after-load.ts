// Resolves after the page's load event and then an idle period, so optional work (the Sentry browser
// SDK) never competes with first paint, hydration or the hero for network and main thread.
export const IDLE_TIMEOUT_MS = 4000;
/** Used where requestIdleCallback is missing (Safari). */
export const IDLE_FALLBACK_MS = 1000;

type LoadWindow = Pick<Window, "addEventListener" | "setTimeout"> & {
  document: Pick<Document, "readyState">;
  requestIdleCallback?: Window["requestIdleCallback"];
};

export function afterLoadIdle(win: LoadWindow = window): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (typeof win.requestIdleCallback === "function") {
        win.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
      } else {
        win.setTimeout(resolve, IDLE_FALLBACK_MS);
      }
    };
    if (win.document.readyState === "complete") idle();
    else win.addEventListener("load", idle, { once: true });
  });
}
