import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutEffect } from "react";
import { HeroLoader, IDLE_TIMEOUT_MS } from "@/components/ecosystem-graphic/hero-loader";

// A computed href keeps the Next.js lint rule about internal anchors out of these stand-ins.
const WET_LAB_HREF = ["/ecosystem", "wet-lab"].join("/");

// The real layer pulls in Motion; the loader contract is only about when and how it is mounted.
const mounted = vi.fn();
vi.mock("@/components/ecosystem-graphic/interactive", () => ({
  default: function FakeInteractive(props: {
    onReady: () => void;
    swapped: boolean;
    initialFocus: string | null;
    initialHovering?: boolean;
  }) {
    const { onReady } = props;
    useLayoutEffect(() => onReady(), [onReady]);
    mounted(props);
    return (
      <div data-testid="interactive" data-swapped={String(props.swapped)}>
        <a href={WET_LAB_HREF} data-slug="wet-lab">
          twin
        </a>
      </div>
    );
  },
}));

type Listener = () => void;
function stubMatchMedia(reduced: boolean) {
  const listeners = new Set<Listener>();
  const query = {
    matches: reduced,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  vi.stubGlobal("matchMedia", () => query);
  return {
    set(next: boolean) {
      query.matches = next;
      listeners.forEach((l) => l());
    },
  };
}

const Static = () => (
  <svg>
    <g data-slug="wet-lab">
      <a href={WET_LAB_HREF}>static</a>
    </g>
  </svg>
);

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function flushAndGet() {
  await flush();
  await flush();
  return screen.getByTestId("interactive");
}

describe("HeroLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mounted.mockClear();
    vi.stubGlobal("requestIdleCallback", undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the static children first and no interactive layer", () => {
    stubMatchMedia(false);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    expect(screen.getByText("static")).toBeInTheDocument();
    expect(screen.queryByTestId("interactive")).toBeNull();
  });

  it("loads the interactive layer after the idle timeout and swaps in one commit", async () => {
    stubMatchMedia(false);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS - 1);
    });
    expect(screen.queryByTestId("interactive")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });
    await flush();
    expect(await flushAndGet()).toBeInTheDocument();
    // The static children are gone in the same committed state.
    expect(screen.queryByText("static")).toBeNull();
    expect(screen.getByTestId("interactive")).toHaveAttribute("data-swapped", "true");
  });

  it("uses requestIdleCallback with a 2000 ms timeout when available", async () => {
    stubMatchMedia(false);
    const idle = vi.fn((cb: () => void) => {
      queueMicrotask(cb);
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", idle);
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const { unmount } = render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: IDLE_TIMEOUT_MS });
    await flush();
    expect(await flushAndGet()).toBeInTheDocument();
    unmount();
  });

  it("loads earlier on first focus intent", async () => {
    stubMatchMedia(false);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.focus(screen.getByText("static"));
    await flush();
    expect(await flushAndGet()).toBeInTheDocument();
  });

  it("loads earlier on pointer and touch intent", async () => {
    stubMatchMedia(false);
    const { container } = render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.touchStart(container.firstElementChild!);
    await flush();
    expect(await flushAndGet()).toBeInTheDocument();
  });

  it("never loads under reduced motion, not on idle and not on intent", async () => {
    stubMatchMedia(true);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.focus(screen.getByText("static"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS * 3);
    });
    expect(screen.queryByTestId("interactive")).toBeNull();
    expect(mounted).not.toHaveBeenCalled();
    expect(screen.getByText("static")).toBeInTheDocument();
  });

  it("returns to the static layer when reduced motion turns on", async () => {
    const media = stubMatchMedia(false);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.focus(screen.getByText("static"));
    await flush();
    expect(await flushAndGet()).toBeInTheDocument();
    act(() => media.set(true));
    expect(screen.queryByTestId("interactive")).toBeNull();
    expect(screen.getByText("static")).toBeInTheDocument();
  });

  it("seeds the interactive layer with the pointer hover present at the swap", async () => {
    stubMatchMedia(false);
    const { container } = render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.pointerEnter(container.firstElementChild!, { pointerType: "mouse" });
    await flushAndGet();
    expect(mounted).toHaveBeenLastCalledWith(expect.objectContaining({ initialHovering: true }));
  });

  it("does not seed hover from a touch pointer", async () => {
    stubMatchMedia(false);
    const { container } = render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    fireEvent.pointerEnter(container.firstElementChild!, { pointerType: "touch" });
    await flushAndGet();
    expect(mounted).toHaveBeenLastCalledWith(expect.objectContaining({ initialHovering: false }));
  });

  it("passes the slug that held focus to the interactive layer", async () => {
    stubMatchMedia(false);
    render(
      <HeroLoader>
        <Static />
      </HeroLoader>,
    );
    const staticLink = screen.getByText("static");
    staticLink.focus();
    fireEvent.focus(staticLink);
    await flush();
    await flushAndGet();
    expect(mounted).toHaveBeenLastCalledWith(
      expect.objectContaining({ swapped: true, initialFocus: "wet-lab" }),
    );
  });
});
