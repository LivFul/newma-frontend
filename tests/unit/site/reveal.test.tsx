import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevealRoot } from "@/components/site/reveal";

type Entry = Pick<IntersectionObserverEntry, "isIntersecting" | "target">;

// A controllable observer: tests decide when, and for which node, an intersection is reported.
function stubObserver() {
  const observed: Element[] = [];
  const unobserved: Element[] = [];
  const disconnect = vi.fn();
  let report: (entries: Entry[]) => void = () => undefined;
  class FakeObserver {
    constructor(callback: IntersectionObserverCallback) {
      report = (entries) =>
        callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
    }
    observe(target: Element) {
      observed.push(target);
    }
    unobserve(target: Element) {
      unobserved.push(target);
    }
    disconnect = disconnect;
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return { observed, unobserved, disconnect, report: (entries: Entry[]) => report(entries) };
}

const place = (node: Element, top: number, bottom: number) =>
  vi.spyOn(node, "getBoundingClientRect").mockReturnValue({ top, bottom } as DOMRect);

describe("RevealRoot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Value: protects=a section stays hidden until it intersects, then reveals once and is released, and unmounting disconnects the observer; fails_when=the isIntersecting guard is dropped so everything reveals at once, the node is not unobserved, or the observer leaks; why_new=the old fake reported every node as intersecting, so no negative path was covered; seam=none
  it("keeps a section pending until it intersects, then reveals and releases it", () => {
    const { observed, unobserved, disconnect, report } = stubObserver();
    const { container, unmount } = render(
      <div>
        <section data-reveal>Later</section>
        <RevealRoot />
      </div>,
    );
    const section = container.querySelector("[data-reveal]")!;
    expect(section.classList.contains("reveal-pending")).toBe(true);
    expect(observed).toEqual([section]);

    act(() => report([{ isIntersecting: false, target: section }]));
    expect(section.classList.contains("reveal-in")).toBe(false);
    expect(section.classList.contains("reveal-pending")).toBe(true);

    act(() => report([{ isIntersecting: true, target: section }]));
    expect(section.classList.contains("reveal-in")).toBe(true);
    expect(section.classList.contains("reveal-pending")).toBe(false);
    expect(unobserved).toEqual([section]);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  // Value: protects=a section already on screen at mount is left as painted, with no hide-then-fade flash, while one below the fold still waits; fails_when=the in-view check is removed so every section is hidden after hydration; why_new=every section was hidden after hydration, which flashed content that was already visible; seam=none
  it("leaves a section that is already on screen alone", () => {
    const { observed } = stubObserver();
    const { container } = render(
      <div>
        <section data-reveal>Visible</section>
        <section data-reveal>Below</section>
      </div>,
    );
    const [visible, below] = [...container.querySelectorAll("[data-reveal]")] as [Element, Element];
    place(visible, 120, 520);
    place(below, window.innerHeight + 300, window.innerHeight + 700);
    render(<RevealRoot />, { container: document.body.appendChild(document.createElement("i")) });
    expect(visible.classList.contains("reveal-pending")).toBe(false);
    expect(below.classList.contains("reveal-pending")).toBe(true);
    expect(observed).toEqual([below]);
  });

  // Value: protects=a section fully above the viewport (after scroll restoration or an anchor jump) and one just under the observer's bottom margin still wait to be revealed; fails_when=the bottom > 0 or the 92% line check is dropped or shifted; why_new=only an on-screen and a far-below section were covered; seam=none
  it("hides sections above the viewport and just below the reveal line", () => {
    const { observed } = stubObserver();
    const { container } = render(
      <div>
        <section data-reveal>Above</section>
        <section data-reveal>Edge</section>
        <section data-reveal>Inside</section>
      </div>,
    );
    const [above, edge, inside] = [...container.querySelectorAll("[data-reveal]")] as [
      Element,
      Element,
      Element,
    ];
    place(above, -600, -100);
    place(edge, window.innerHeight * 0.93, window.innerHeight * 0.93 + 300);
    place(inside, window.innerHeight * 0.9, window.innerHeight * 0.9 + 300);
    render(<RevealRoot />, { container: document.body.appendChild(document.createElement("i")) });
    expect(observed).toEqual([above, edge]);
    expect(inside.classList.contains("reveal-pending")).toBe(false);
  });

  // Value: protects=visitors who prefer reduced motion get every section revealed at once, with no observer and no hidden pending state; fails_when=the reduced-motion branch is removed so sections wait on scroll; why_new=only the intersect path was tested; seam=none
  it("reveals every section immediately when the visitor prefers reduced motion", () => {
    const Observer = vi.fn();
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { container } = render(
      <div>
        <section data-reveal>One</section>
        <section data-reveal>Two</section>
        <RevealRoot />
      </div>,
    );
    for (const node of container.querySelectorAll("[data-reveal]")) {
      expect(node.classList.contains("reveal-in")).toBe(true);
      expect(node.classList.contains("reveal-pending")).toBe(false);
    }
    expect(Observer).not.toHaveBeenCalled();
  });

  // Value: protects=browsers without IntersectionObserver still show every section; fails_when=the support check is dropped so the effect throws or sections stay hidden; why_new=only the intersect path was tested; seam=none
  it("reveals sections in a browser without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(
      <div>
        <section data-reveal>Later</section>
        <RevealRoot />
      </div>,
    );
    expect(container.querySelector("[data-reveal]")?.classList.contains("reveal-in")).toBe(true);
  });
});
