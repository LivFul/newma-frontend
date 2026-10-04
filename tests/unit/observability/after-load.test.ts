import { afterEach, describe, expect, it, vi } from "vitest";
import { afterLoadIdle, IDLE_FALLBACK_MS } from "@/lib/observability/after-load";

type IdleWindow = Window & { requestIdleCallback?: Window["requestIdleCallback"] };

function fakeWindow(readyState: DocumentReadyState, idle?: (cb: () => void) => number) {
  const target = new EventTarget();
  return {
    document: { readyState },
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    setTimeout: (cb: () => void, ms: number) => window.setTimeout(cb, ms),
    requestIdleCallback: idle,
  } as unknown as IdleWindow & EventTarget;
}

const settledFlag = (promise: Promise<void>) => {
  const state = { done: false };
  void promise.then(() => (state.done = true));
  return state;
};

describe("afterLoadIdle", () => {
  afterEach(() => vi.useRealTimers());

  it("waits for the load event, then for an idle period", async () => {
    const idleCallbacks: (() => void)[] = [];
    const win = fakeWindow("interactive", (cb) => idleCallbacks.push(cb));
    const state = settledFlag(afterLoadIdle(win));
    await Promise.resolve();
    expect(idleCallbacks).toHaveLength(0);
    win.dispatchEvent(new Event("load"));
    expect(idleCallbacks).toHaveLength(1);
    await Promise.resolve();
    expect(state.done).toBe(false);
    idleCallbacks[0]!();
    await Promise.resolve();
    expect(state.done).toBe(true);
  });

  it("goes straight to the idle wait when the page has already loaded", async () => {
    const idleCallbacks: (() => void)[] = [];
    const win = fakeWindow("complete", (cb) => idleCallbacks.push(cb));
    const promise = afterLoadIdle(win);
    expect(idleCallbacks).toHaveLength(1);
    idleCallbacks[0]!();
    await expect(promise).resolves.toBeUndefined();
  });

  it("falls back to a timer where requestIdleCallback is missing (Safari)", async () => {
    vi.useFakeTimers();
    const win = fakeWindow("complete");
    const state = settledFlag(afterLoadIdle(win));
    await vi.advanceTimersByTimeAsync(IDLE_FALLBACK_MS - 1);
    expect(state.done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.done).toBe(true);
  });
});
