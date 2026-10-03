import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAction } from "@/lib/demo/use-action";

describe("useAction", () => {
  it("is busy only while the action runs and ignores re-entry while busy", async () => {
    const { result } = renderHook(() => useAction());
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let calls = 0;
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.run(async () => {
        calls += 1;
        await gate;
      });
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      await result.current.run(async () => {
        calls += 1;
      });
    });
    expect(calls).toBe(1);
    await act(async () => {
      release();
      await first;
    });
    expect(result.current.busy).toBe(false);
    await act(async () => {
      await result.current.run(async () => {
        calls += 1;
      });
    });
    expect(calls).toBe(2);
  });

  it("clears busy when the action throws", async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      await result.current
        .run(async () => {
          throw new Error("boom");
        })
        .catch(() => undefined);
    });
    expect(result.current.busy).toBe(false);
  });
});
