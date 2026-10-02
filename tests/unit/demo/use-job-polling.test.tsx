import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJobPolling } from "@/lib/demo/use-job-polling";
import type { Job } from "@/lib/demo/jobs";

const job = (state: Job["state"], progress: number): Job => ({
  id: "job-1",
  kind: "screening",
  state,
  progress,
  attempts: 0,
  max_attempts: 3,
  result: null,
  error: null,
  cost_credits: 0,
  budget_credits: null,
  created_at: "2030-01-01T00:00:00Z",
  updated_at: "2030-01-01T00:00:00Z",
  started_at: null,
  finished_at: null,
});

type FetchArgs = [string, RequestInit | undefined];

function armPolling(sequence: Array<Job | Response>) {
  const queue = [...sequence];
  const fetchMock = vi.fn<(...args: FetchArgs) => Promise<Response>>(async () => {
    const next = queue.shift() ?? queue[queue.length - 1];
    return next instanceof Response ? next : Response.json(next);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe("useJobPolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fetches at once, then every 2000 ms, and stops on a terminal state", async () => {
    const fetchMock = armPolling([
      job("QUEUED", 0),
      job("RUNNING", 0.4),
      job("SUCCEEDED", 1),
      job("SUCCEEDED", 1),
    ]);
    const { result } = renderHook(() => useJobPolling("job-1"));
    expect(result.current.isPolling).toBe(true);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/demo/jobs/job-1");
    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
    expect(result.current.job?.state).toBe("QUEUED");

    await tick(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.job?.progress).toBe(0.4);

    await tick(2000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.job?.state).toBe("SUCCEEDED");
    expect(result.current.isPolling).toBe(false);

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("honours a custom interval", async () => {
    const fetchMock = armPolling([job("RUNNING", 0.1)]);
    renderHook(() => useJobPolling("job-1", { intervalMs: 500 }));
    await flush();
    await tick(500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling and aborts the in-flight request on unmount", async () => {
    const fetchMock = armPolling([job("RUNNING", 0.1)]);
    const { unmount } = renderHook(() => useJobPolling("job-1"));
    await flush();
    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
    await tick(6000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports an error envelope and stops when the BFF answers 401", async () => {
    armPolling([Response.json({ code: "session_expired", message: "gone" }, { status: 401 })]);
    const { result } = renderHook(() => useJobPolling("job-1"));
    await flush();
    expect(result.current.error).toEqual({ code: "session_expired", message: "gone" });
    expect(result.current.isPolling).toBe(false);
  });

  it("keeps polling through a transient network failure", async () => {
    const fetchMock = vi
      .fn<(...args: FetchArgs) => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValue(Response.json(job("RUNNING", 0.2)));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useJobPolling("job-1"));
    await flush();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.isPolling).toBe(true);
    await tick(2000);
    expect(result.current.job?.progress).toBe(0.2);
    expect(result.current.error).toBeUndefined();
  });
});
