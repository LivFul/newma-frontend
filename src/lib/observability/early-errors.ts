// Holds uncaught errors and unhandled rejections raised before the lazily loaded Sentry SDK has
// installed its own handlers, so deferring the SDK does not lose them.
export const MAX_EARLY_ERRORS = 10;

export type EarlyErrorBuffer = Readonly<{
  /** Passes every held error to `capture` once, then stops listening. */
  flush: (capture: (error: unknown) => void) => void;
}>;

const errorOf = (event: Event): unknown => {
  if (event.type === "unhandledrejection") return (event as PromiseRejectionEvent).reason;
  const { error, message } = event as ErrorEvent;
  return error ?? message;
};

export function bufferEarlyErrors(target: EventTarget = window): EarlyErrorBuffer {
  let held: readonly unknown[] = [];
  let flushed = false;
  const hold = (event: Event) => {
    if (held.length < MAX_EARLY_ERRORS) held = [...held, errorOf(event)];
  };
  target.addEventListener("error", hold);
  target.addEventListener("unhandledrejection", hold);
  return {
    flush: (capture) => {
      if (flushed) return;
      flushed = true;
      target.removeEventListener("error", hold);
      target.removeEventListener("unhandledrejection", hold);
      held.forEach((error) => capture(error));
      held = [];
    },
  };
}
