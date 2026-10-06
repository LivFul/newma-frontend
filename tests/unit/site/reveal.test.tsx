import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RevealRoot } from "@/components/site/reveal";

describe("RevealRoot", () => {
  it("adds reveal-in when a data-reveal node intersects", async () => {
    class FakeObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [0];
      constructor(private readonly cb: IntersectionObserverCallback) {}
      disconnect() {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
          this,
        );
      }
      takeRecords() {
        return [];
      }
      unobserve() {}
    }
    window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    const { container } = render(
      <div>
        <section data-reveal>Later</section>
        <RevealRoot />
      </div>,
    );
    await waitFor(() =>
      expect(container.querySelector("[data-reveal]")?.classList.contains("reveal-in")).toBe(true),
    );
  });
});
