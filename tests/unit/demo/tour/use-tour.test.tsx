import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_RESET_EVENT } from "@/lib/demo/tour/reset-event";
import { TOUR_STORAGE_KEY, goTo, serializeState, startTour } from "@/lib/demo/tour/state";
import { useTour } from "@/lib/demo/tour/use-tour";

const TENANT = "tenant-abc";

describe("useTour", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    const { result } = renderHook(() => useTour(TENANT));
    act(() => result.current.end());
    window.sessionStorage.clear();
  });

  it("is inactive until a tour is started, then persists under newma.tour.v1", () => {
    const { result } = renderHook(() => useTour(TENANT));
    expect(result.current.state).toBeUndefined();
    act(() => result.current.start());
    expect(result.current.state).toMatchObject({ tenant_id: TENANT, current: 0, done: [] });
    const stored = JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY) ?? "null");
    expect(stored).toMatchObject({ version: 1, tenant_id: TENANT });
    expect(Object.keys(stored).sort()).toEqual([
      "current",
      "done",
      "started_at",
      "tenant_id",
      "version",
    ]);
  });

  it("updates the stored state through a pure function and ends the tour", () => {
    const { result } = renderHook(() => useTour(TENANT));
    act(() => result.current.start());
    act(() => result.current.update((state) => goTo(state, 4)));
    expect(result.current.state?.current).toBe(4);
    act(() => result.current.end());
    expect(result.current.state).toBeUndefined();
    expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
  });

  it("restores progress after a remount (reload)", () => {
    window.sessionStorage.setItem(TOUR_STORAGE_KEY, serializeState(goTo(startTour(TENANT), 7)));
    const { result } = renderHook(() => useTour(TENANT));
    expect(result.current.state?.current).toBe(7);
  });

  it("reports a value from another tenant as discarded and does not use it", () => {
    window.sessionStorage.setItem(TOUR_STORAGE_KEY, serializeState(startTour("tenant-other")));
    const { result } = renderHook(() => useTour(TENANT));
    expect(result.current.state).toBeUndefined();
    expect(result.current.discarded).toBe("tenant");
    act(() => result.current.end());
    expect(result.current.discarded).toBeUndefined();
  });

  it("reports malformed storage as discarded", () => {
    window.sessionStorage.setItem(TOUR_STORAGE_KEY, "{oops");
    const { result } = renderHook(() => useTour(TENANT));
    expect(result.current.discarded).toBe("malformed");
  });

  it("follows another document through the storage event", () => {
    const { result } = renderHook(() => useTour(TENANT));
    expect(result.current.state).toBeUndefined();
    act(() => {
      window.sessionStorage.setItem(TOUR_STORAGE_KEY, serializeState(goTo(startTour(TENANT), 3)));
      window.dispatchEvent(new StorageEvent("storage", { key: TOUR_STORAGE_KEY }));
    });
    expect(result.current.state?.current).toBe(3);
  });

  it("ignores storage events for other keys", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem");
    renderHook(() => useTour(TENANT));
    spy.mockClear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("keeps working in memory when sessionStorage throws on every access", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const { result } = renderHook(() => useTour(TENANT));
    expect(() => act(() => result.current.start())).not.toThrow();
    expect(result.current.state?.current).toBe(0);
    act(() => result.current.update((state) => goTo(state, 2)));
    expect(result.current.state?.current).toBe(2);
    expect(() => act(() => result.current.end())).not.toThrow();
    expect(result.current.state).toBeUndefined();
  });

  it("falls back to memory when a write hits the storage quota", () => {
    const { result } = renderHook(() => useTour(TENANT));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    act(() => result.current.start());
    expect(result.current.state?.current).toBe(0);
    act(() => result.current.update((state) => goTo(state, 5)));
    expect(result.current.state?.current).toBe(5);
  });

  it("returns to step one when the demo is reset anywhere on the page", () => {
    const { result } = renderHook(() => useTour(TENANT));
    act(() => result.current.start());
    act(() => result.current.update((state) => goTo(state, 9)));
    act(() => {
      window.dispatchEvent(new Event(DEMO_RESET_EVENT));
    });
    expect(result.current.state).toMatchObject({ current: 0, done: [] });
  });

  it("does nothing on a reset event when no tour is active", () => {
    const { result } = renderHook(() => useTour(TENANT));
    act(() => {
      window.dispatchEvent(new Event(DEMO_RESET_EVENT));
    });
    expect(result.current.state).toBeUndefined();
    expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
  });
});
