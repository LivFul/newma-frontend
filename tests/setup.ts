import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Lazily imported dialogs and panels resolve after a dynamic import; under a full parallel run that
// can exceed Testing Library's default 1 s wait. A longer ceiling only slows a genuine failure.
configure({ asyncUtilTimeout: 5_000 });

// jsdom has no layout engine; Radix popper-based primitives (Tooltip) need ResizeObserver.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
}

// jsdom has no matchMedia; the hero loader reads prefers-reduced-motion. Tests that care stub it.
if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
