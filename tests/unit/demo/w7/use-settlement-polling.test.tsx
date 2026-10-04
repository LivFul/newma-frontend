import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettlementPolling } from "@/lib/demo/use-settlement-polling";
import type { AnchorStatus } from "@/lib/demo/types";
import { UUID, anchor, settlement } from "./fixtures";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const withAnchor = (status: AnchorStatus) => settlement({ anchor: anchor({ status }) });
const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const arm = (sequence: AnchorStatus[]) => {
  const queue = [...sequence];
  const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
    Response.json(withAnchor(queue.shift() ?? "anchored")),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("useSettlementPolling (2000 ms, only while the anchor is pending)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("polls the settlement BFF every 2 s while pending and stops once anchored", async () => {
    const fetchMock = arm(["pending", "anchored"]);
    const initial = withAnchor("pending");
    const { result } = renderHook(() => useSettlementPolling(initial));
    expect(result.current.anchor.status).toBe("pending");
    await tick(0);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}`);
    await tick(2000);
    expect(result.current.anchor.status).toBe("anchored");
    await tick(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["not_requested", "anchored"] as const)(
    "never polls when the anchor is %s",
    async (status) => {
      const fetchMock = arm([]);
      const initial = withAnchor(status);
      const { result } = renderHook(() => useSettlementPolling(initial));
      await tick(10_000);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current).toBe(initial);
    },
  );

  it("stops on unmount", async () => {
    const fetchMock = arm(["pending", "pending", "pending"]);
    const initial = withAnchor("pending");
    const { unmount } = renderHook(() => useSettlementPolling(initial));
    await tick(0);
    unmount();
    await tick(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
