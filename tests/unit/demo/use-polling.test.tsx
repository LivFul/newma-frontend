import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "@/lib/demo/use-polling";

const push = vi.fn();
const router = { push };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

type Item = { status: string };

function arm(sequence: Array<Item | Response>) {
  const queue = [...sequence];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift() ?? queue[queue.length - 1];
    return next instanceof Response ? next : Response.json(next);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const done = (item: Item) => item.status === "completed";

describe("usePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("polls every 2000 ms and stops on a terminal value", async () => {
    const fetchMock = arm([{ status: "running" }, { status: "completed" }]);
    const { result } = renderHook(() => usePolling<Item>("/api/demo/x", done));
    await tick(0);
    expect(result.current.data).toEqual({ status: "running" });
    expect(result.current.isPolling).toBe(true);
    await tick(2000);
    expect(result.current.data).toEqual({ status: "completed" });
    expect(result.current.isPolling).toBe(false);
    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/demo/x",
      expect.objectContaining({ cache: "no-store" }),
    ]);
  });

  it("stops on unmount", async () => {
    const fetchMock = arm([{ status: "running" }]);
    const { unmount } = renderHook(() => usePolling<Item>("/api/demo/x", done));
    await tick(0);
    unmount();
    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops on a non-retryable error and redirects on 401", async () => {
    const fetchMock = arm([
      Response.json({ code: "session_expired", message: "gone" }, { status: 401 }),
    ]);
    const { result } = renderHook(() => usePolling<Item>("/api/demo/x", done));
    await tick(0);
    expect(result.current.error?.code).toBe("session_expired");
    expect(result.current.isPolling).toBe(false);
    expect(push).toHaveBeenCalledWith("/api/demo/sessions/expired");
    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps polling through a 503 and a network error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue(Response.json({ status: "completed" }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => usePolling<Item>("/api/demo/x", done));
    await tick(0);
    expect(result.current.error?.code).toBe("upstream_error");
    await tick(2000);
    expect(result.current.error?.code).toBe("network_error");
    await tick(2000);
    expect(result.current.data).toEqual({ status: "completed" });
    expect(result.current.error).toBeUndefined();
  });

  it("does nothing without a url", async () => {
    const fetchMock = arm([]);
    const { result } = renderHook(() => usePolling<Item>(undefined, done));
    await tick(5000);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isPolling).toBe(false);
  });
});
