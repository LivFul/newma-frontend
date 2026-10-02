import "@testing-library/jest-dom/vitest";

// jsdom has no layout engine; Radix popper-based primitives (Tooltip) need ResizeObserver.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
}
