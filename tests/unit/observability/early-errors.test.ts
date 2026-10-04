import { describe, expect, it, vi } from "vitest";
import { bufferEarlyErrors, MAX_EARLY_ERRORS } from "@/lib/observability/early-errors";

const errorEvent = (error: unknown) => new ErrorEvent("error", { error });
const rejection = (reason: unknown) => {
  const event = new Event("unhandledrejection") as Event & { reason: unknown };
  Object.defineProperty(event, "reason", { value: reason });
  return event;
};

describe("bufferEarlyErrors", () => {
  it("hands uncaught errors and rejections raised before the SDK loads to the capture function", () => {
    const target = new EventTarget();
    const buffer = bufferEarlyErrors(target);
    const boom = new Error("boom");
    target.dispatchEvent(errorEvent(boom));
    target.dispatchEvent(rejection("nope"));
    const capture = vi.fn();
    buffer.flush(capture);
    expect(capture.mock.calls).toEqual([[boom], ["nope"]]);
  });

  it("stops listening once flushed, so the SDK's own handlers are the only ones left", () => {
    const target = new EventTarget();
    const buffer = bufferEarlyErrors(target);
    const capture = vi.fn();
    buffer.flush(capture);
    target.dispatchEvent(errorEvent(new Error("late")));
    buffer.flush(capture);
    expect(capture).not.toHaveBeenCalled();
  });

  it("keeps at most a bounded number of errors", () => {
    const target = new EventTarget();
    const buffer = bufferEarlyErrors(target);
    for (let i = 0; i < MAX_EARLY_ERRORS + 5; i += 1)
      target.dispatchEvent(errorEvent(new Error(`${i}`)));
    const capture = vi.fn();
    buffer.flush(capture);
    expect(capture).toHaveBeenCalledTimes(MAX_EARLY_ERRORS);
  });

  it("falls back to the message when an error event carries no error object", () => {
    const target = new EventTarget();
    const buffer = bufferEarlyErrors(target);
    target.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));
    const capture = vi.fn();
    buffer.flush(capture);
    expect(capture).toHaveBeenCalledWith("Script error.");
  });
});
