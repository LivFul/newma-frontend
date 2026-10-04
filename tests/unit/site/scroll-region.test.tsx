import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollRegion } from "@/components/site/scroll-region";

type Callback = () => void;
const observers: Callback[] = [];

class FakeResizeObserver {
  private readonly callback: Callback;
  constructor(callback: Callback) {
    this.callback = callback;
    observers.push(callback);
  }
  observe() {}
  disconnect() {
    const index = observers.indexOf(this.callback);
    if (index >= 0) observers.splice(index, 1);
  }
}

function sizeOf(element: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
}

afterEach(() => {
  vi.unstubAllGlobals();
  observers.length = 0;
});

describe("ScrollRegion", () => {
  it("is a named region and a tab stop in the server markup, which is all that no-JS users get", () => {
    const html = renderToStaticMarkup(<ScrollRegion label="Diagram">content</ScrollRegion>);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Diagram"');
    expect(html).toContain('tabindex="0"');
  });

  it("is named and reachable as a region once rendered", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    render(<ScrollRegion label="Diagram">content</ScrollRegion>);
    expect(screen.getByRole("region", { name: "Diagram" })).toBeInTheDocument();
  });

  it("stays a tab stop when the content scrolls sideways", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const proto = HTMLElement.prototype;
    vi.spyOn(proto, "scrollWidth", "get").mockReturnValue(900);
    vi.spyOn(proto, "clientWidth", "get").mockReturnValue(300);
    render(<ScrollRegion label="Diagram">content</ScrollRegion>);
    expect(screen.getByRole("region", { name: "Diagram" })).toHaveAttribute("tabindex", "0");
  });

  it("leaves the tab order once the content fits", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    render(<ScrollRegion label="Diagram">content</ScrollRegion>);
    expect(screen.getByRole("region", { name: "Diagram" })).toHaveAttribute("tabindex", "-1");
  });

  it("re-measures when the region is resized", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    render(<ScrollRegion label="Diagram">content</ScrollRegion>);
    const region = screen.getByRole("region", { name: "Diagram" });

    sizeOf(region, 900, 300);
    observers.forEach((callback) => callback());
    expect(region).toHaveAttribute("tabindex", "0");

    sizeOf(region, 300, 300);
    observers.forEach((callback) => callback());
    expect(region).toHaveAttribute("tabindex", "-1");
  });

  it("stops observing when it unmounts", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { unmount } = render(<ScrollRegion label="Diagram">content</ScrollRegion>);
    expect(observers).toHaveLength(1);
    unmount();
    expect(observers).toHaveLength(0);
  });
});
