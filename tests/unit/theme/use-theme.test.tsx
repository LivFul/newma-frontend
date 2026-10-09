import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme/state";
import { THEME_COLOR_META_ID } from "@/lib/theme/dom";
import { useThemeApplicator } from "@/lib/theme/use-theme-applicator";
import { useThemePreference } from "@/lib/theme/use-theme-preference";

function mockColorScheme(dark: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("prefers-color-scheme: dark") && dark,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe("useThemePreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.style.colorScheme = "";
    delete document.documentElement.dataset.theme;
    document.getElementById(THEME_COLOR_META_ID)?.remove();
    mockColorScheme(false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("defaults to dark on the server snapshot until storage is read", () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.preference).toBe("dark");
    expect(result.current.resolved).toBe("dark");
  });

  it("persists manual dark without applying dom when used alone", () => {
    const { result } = renderHook(() => useThemePreference());
    act(() => result.current.setPreference("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(result.current.preference).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("useThemeApplicator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.style.colorScheme = "";
    delete document.documentElement.dataset.theme;
    document.getElementById(THEME_COLOR_META_ID)?.remove();
    mockColorScheme(false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("applies dark when storage is empty even on a light OS", () => {
    renderHook(() => useThemeApplicator());
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.preference).toBe("dark");
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("persists manual dark and applies the dark class and theme-color meta", () => {
    renderHook(() => useThemeApplicator());
    const { result } = renderHook(() => useThemePreference());
    act(() => result.current.setPreference("dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.getElementById(THEME_COLOR_META_ID)?.getAttribute("content")).toBe("#06242b");
  });

  it("forces light over a dark OS preference", () => {
    mockColorScheme(true);
    renderHook(() => useThemeApplicator());
    const { result } = renderHook(() => useThemePreference());
    act(() => result.current.setPreference("light"));
    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the OS when preference is system", () => {
    mockColorScheme(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    renderHook(() => useThemeApplicator());
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("reacts to storage events from another document", () => {
    renderHook(() => useThemeApplicator());
    const { result } = renderHook(() => useThemePreference());
    act(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
    });
    expect(result.current.preference).toBe("dark");
  });
});
