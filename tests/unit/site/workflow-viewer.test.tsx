import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SCENE_MODULE = "@/components/workflow-3d/workflow-scene";
const sceneLoaded = vi.fn();

interface FakeSceneProps {
  aspect: string;
  height?: number;
  onReady: () => void;
  onFailure: (reason: "no-webgl" | "error") => void;
}

// Registered per test with doMock: Vitest caches a mock factory's result across resetModules, so a
// factory registered once would count only the first test's load. By default the fake renderer starts
// at once, as a working WebGL one would; with autoReady off it waits for its "scene ready" button.
function makeSceneFactory({ autoReady = true } = {}) {
  return () => {
    sceneLoaded();
    return {
      WorkflowScene: ({ aspect, height, onReady, onFailure }: FakeSceneProps) => {
        useEffect(() => {
          if (autoReady) onReady();
        }, [onReady]);
        return (
          <div data-testid="scene" data-aspect={aspect} data-height={height ?? ""}>
            <button type="button" onClick={onReady}>
              scene ready
            </button>
            <button type="button" onClick={() => onFailure("no-webgl")}>
              scene failed
            </button>
            <button type="button" onClick={() => onFailure("error")}>
              scene errored
            </button>
          </div>
        );
      },
    };
  };
}
const sceneFactory = makeSceneFactory();

const LABELS = {
  explore: "Explore it",
  close: "Back",
  loading: "Loading it",
  ready: "It is ready",
  failed: "It failed",
  unavailable: "Not available",
};

async function renderViewer(
  children: ReactNode = <p>static diagram</p>,
  factory: Parameters<typeof vi.doMock>[1] = sceneFactory,
) {
  // A fresh module registry gives each test its own shared request and its own mock load.
  vi.resetModules();
  vi.doMock(SCENE_MODULE, factory);
  const { WorkflowViewer } = await import("@/components/site/workflow-viewer");
  const view = render(
    <WorkflowViewer labels={LABELS} aspect="4 / 3">
      {children}
    </WorkflowViewer>,
  );
  return { ...view, WorkflowViewer };
}

// A rect far below the viewport, as for an element the visitor has scrolled well past.
const OFF_SCREEN = {
  top: 5000,
  bottom: 5400,
  left: 0,
  right: 800,
  x: 0,
  y: 5000,
  width: 800,
  height: 400,
};
const offScreen = (element: Element) =>
  vi
    .spyOn(element, "getBoundingClientRect")
    .mockReturnValue({ ...OFF_SCREEN, toJSON: () => OFF_SCREEN });

const viewerOf = (container: HTMLElement) => container.querySelector("[data-workflow-viewer]")!;

afterEach(() => vi.restoreAllMocks());
beforeEach(() => sceneLoaded.mockClear());

describe("WorkflowViewer", () => {
  it("shows the static diagram and an explore button, and loads nothing yet", async () => {
    await renderViewer();
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: LABELS.explore })).toBeInTheDocument();
    expect(sceneLoaded).not.toHaveBeenCalled();
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(document.querySelector(".workflow-swap")).not.toBeNull();
  });

  it("has a status region that is empty until something happens", async () => {
    await renderViewer();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("loads the scene on click, announces it, and swaps it in for the diagram", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));

    const scene = await screen.findByTestId("scene");
    expect(scene).toHaveAttribute("data-aspect", "4 / 3");
    expect(screen.queryByText("static diagram")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.ready);
    expect(screen.getByRole("button", { name: LABELS.close })).toBeInTheDocument();
    expect(sceneLoaded).toHaveBeenCalledTimes(1);
  });

  it("returns to the diagram from the back button and keeps focus on the same control", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await screen.findByTestId("scene");

    const back = screen.getByRole("button", { name: LABELS.close });
    back.focus();
    await user.click(back);
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(screen.getByRole("button", { name: LABELS.explore })).toHaveFocus();
  });

  it("closes the scene with Escape", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await screen.findByTestId("scene");
    await user.keyboard("{Escape}");
    expect(screen.getByText("static diagram")).toBeInTheDocument();
  });

  it("puts focus back on the explore button when Escape closes the scene", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    // Focus is inside the scene, which is about to be removed.
    const inside = await screen.findByRole("button", { name: "scene failed" });
    inside.focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(screen.getByRole("button", { name: LABELS.explore })).toHaveFocus();
  });

  it("leaves Escape alone when it is meant for another widget", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await screen.findByTestId("scene");
    // Focus moves to a control that is not part of the viewer, as when another widget has it.
    const outside = document.createElement("input");
    outside.setAttribute("aria-label", "outside the viewer");
    document.body.append(outside);
    try {
      outside.focus();
      await user.keyboard("{Escape}");
      expect(screen.getByTestId("scene")).toBeInTheDocument();
    } finally {
      outside.remove();
    }
  });

  it("does not fetch ahead of a click for visitors who ask to save data", async () => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true,
    });
    try {
      await renderViewer();
      const button = await screen.findByRole("button", { name: LABELS.explore });
      fireEvent.pointerEnter(button);
      button.focus();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(sceneLoaded).not.toHaveBeenCalled();
      // A click is still an explicit request, so it loads.
      await userEvent.setup().click(button);
      await screen.findByTestId("scene");
    } finally {
      Reflect.deleteProperty(navigator, "connection");
    }
  });

  it("gives up on a chunk that never arrives, says so, and allows another try", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await renderViewer(
        <p>static diagram</p>,
        () => new Promise<Record<string, unknown>>(() => undefined),
      );
      fireEvent.click(await screen.findByRole("button", { name: LABELS.explore }));
      expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(21_000);
      });
      expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);
      expect(screen.getByText("static diagram")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: LABELS.explore })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to the diagram and says so when the scene cannot start", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await user.click(await screen.findByRole("button", { name: "scene failed" }));

    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);
    // A browser without WebGL will not gain it on a second click, so the button says so instead.
    expect(screen.getByRole("button", { name: LABELS.unavailable })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  // Value: protects=a start-up error that is not a missing WebGL context stays retryable; fails_when=every scene failure is remembered as no WebGL and locks the button; why_new=only the no-WebGL failure was covered; seam=none
  it("keeps other start-up errors retryable instead of marking the view unavailable", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await user.click(await screen.findByRole("button", { name: "scene errored" }));
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);
    expect(screen.getByRole("button", { name: LABELS.explore })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.queryByRole("button", { name: LABELS.unavailable })).toBeNull();
  });

  // Value: protects=a no-WebGL visitor is not sent round the load, ready, failed loop on every click; fails_when=the renderer failure is forgotten on remount or the unavailable button still loads; why_new=no test rendered the viewer a second time after a renderer failure; seam=none
  it("remembers a renderer failure, and the unavailable button loads nothing", async () => {
    const user = userEvent.setup();
    const { WorkflowViewer, unmount } = await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await user.click(await screen.findByRole("button", { name: "scene failed" }));
    unmount();

    // The same page renders the viewer again, as after a client-side navigation.
    const { container } = render(
      <WorkflowViewer labels={LABELS} aspect="4 / 3">
        <p>static diagram</p>
      </WorkflowViewer>,
    );
    const button = await screen.findByRole("button", { name: LABELS.unavailable });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);

    await user.click(button);
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(viewerOf(container)).toHaveAttribute("data-phase", "unavailable");
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);
  });

  // Value: protects=ready is announced only for a renderer that really started; fails_when=the viewer announces ready as soon as the chunk arrives; why_new=the old fake scene could not delay its start, so ready and mounted were indistinguishable; seam=none
  it("reads as loading while the renderer starts, and announces ready only once it has", async () => {
    const user = userEvent.setup();
    await renderViewer(<p>static diagram</p>, makeSceneFactory({ autoReady: false }));
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));

    await screen.findByTestId("scene");
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
    expect(screen.getByRole("button", { name: LABELS.explore })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "scene ready" }));
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.ready);
    expect(screen.getByRole("button", { name: LABELS.close })).toBeInTheDocument();
  });

  // Value: protects=the scene takes the static diagram's exact height, so the swap shifts nothing; fails_when=the viewer stops measuring the diagram or stops passing the height; why_new=no test checked the scene's size against the diagram's; seam=none
  it("hands the scene the height the diagram had just before the swap", async () => {
    const user = userEvent.setup();
    const rect = { top: 0, bottom: 640, left: 0, right: 800, x: 0, y: 0, width: 800, height: 640 };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      ...rect,
      toJSON: () => rect,
    });
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    expect(await screen.findByTestId("scene")).toHaveAttribute("data-height", "640");
  });

  // Value: protects=Escape on the page body does not close a scene the visitor has scrolled away from; fails_when=a body-focused Escape closes the viewer wherever it is; why_new=the Escape tests only ran with the viewer in view; seam=none
  it("ignores an Escape on the page when the viewer is scrolled out of view", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await screen.findByTestId("scene");
    offScreen(viewerOf(container));
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);

    await user.keyboard("{Escape}");
    expect(screen.getByTestId("scene")).toBeInTheDocument();
  });

  // Value: protects=a body-focused Escape still closes a viewer that is on screen; fails_when=the on-screen check rejects a visible viewer; why_new=the scope check is new; seam=none
  it("closes on an Escape on the page while the viewer is on screen", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    await screen.findByTestId("scene");
    (document.activeElement as HTMLElement).blur();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("scene")).toBeNull();
  });

  // Value: protects=closing the scene moves focus back without scrolling the page to an off-screen button; fails_when=focus is restored with a plain focus() call; why_new=focus-return tests never looked at how focus was moved; seam=none
  it("returns focus to an off-screen button without scrolling the page", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));
    const inside = await screen.findByRole("button", { name: "scene failed" });
    const toggle = screen.getByRole("button", { name: LABELS.close });
    offScreen(toggle);
    const focus = vi.spyOn(toggle, "focus");
    inside.focus();

    await user.keyboard("{Escape}");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(toggle).toHaveFocus();
  });

  it("starts fetching when the pointer reaches the button, but still renders nothing", async () => {
    const user = userEvent.setup();
    await renderViewer();
    const button = await screen.findByRole("button", { name: LABELS.explore });
    fireEvent.pointerEnter(button);
    await waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("scene")).toBeNull();
    // The click reuses the request that the pointer started.
    await user.click(button);
    await screen.findByTestId("scene");
    expect(sceneLoaded).toHaveBeenCalledTimes(1);
  });

  // Value: protects=a failed chunk load can really be retried by the visitor; fails_when=loadScene keeps the rejected request cached so every retry fails again, or a chunk failure is treated as a missing renderer; why_new=failure tests only check the button reappears, never press it; seam=none
  it("loads the scene on a second try after the first load failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let attempts = 0;
    await renderViewer(<p>static diagram</p>, () => {
      attempts += 1;
      if (attempts === 1) throw new Error("chunk failed to load");
      return sceneFactory();
    });

    // Plain clicks, so no hover or focus prefetch spends the failing first attempt.
    fireEvent.click(await screen.findByRole("button", { name: LABELS.explore }));
    expect(await screen.findByText(LABELS.failed)).toBeInTheDocument();

    // A lost chunk is not a missing renderer: the button stays live for another try.
    expect(screen.getByRole("button", { name: LABELS.explore })).not.toHaveAttribute(
      "aria-disabled",
    );
    fireEvent.click(screen.getByRole("button", { name: LABELS.explore }));
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(LABELS.ready));
    expect(attempts).toBe(2);
  });

  // Value: protects=a scene that throws while rendering puts the diagram back instead of taking the home page down, and stays retryable; fails_when=the scene has no error boundary, the crash is remembered as no WebGL, or the boundary is not reset on the next open; why_new=only failures the scene reported itself were covered; seam=none
  it("puts the diagram back when the scene crashes, and lets the visitor try again", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const crash = { now: true };
    const { WorkflowScene: WorkingScene } = sceneFactory();
    function CrashingScene(props: FakeSceneProps) {
      if (crash.now) throw new Error("scene render failed");
      return <WorkingScene {...props} />;
    }
    const user = userEvent.setup();
    const { container } = await renderViewer(<p>static diagram</p>, () => ({
      WorkflowScene: CrashingScene,
    }));
    await user.click(await screen.findByRole("button", { name: LABELS.explore }));

    expect(await screen.findByText("static diagram")).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(LABELS.failed);
    expect(viewerOf(container)).toHaveAttribute("data-phase", "failed");
    expect(consoleError).toHaveBeenCalledWith(
      "workflow scene crashed",
      expect.any(Error),
      expect.anything(),
    );
    const retry = screen.getByRole("button", { name: LABELS.explore });
    expect(retry).not.toHaveAttribute("aria-disabled");

    crash.now = false;
    await user.click(retry);
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
  });

  // Value: protects=a viewport-capped scene is re-capped when the window is resized or the phone rotated; fails_when=the height is computed once at open and never again, or the listener is not attached; why_new=the cap was only checked at open; seam=none
  it("re-caps a sideways-scrolling diagram's scene when the viewport changes", async () => {
    const user = userEvent.setup();
    const rect = {
      top: 0,
      bottom: 1200,
      left: 0,
      right: 400,
      x: 0,
      y: 0,
      width: 400,
      height: 1200,
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      ...rect,
      toJSON: () => rect,
    });
    const initialHeight = window.innerHeight;
    const setViewport = (height: number) =>
      Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
    try {
      setViewport(1000);
      await renderViewer(
        <div data-testid="region">
          <p>static diagram</p>
        </div>,
      );
      const region = screen.getByTestId("region");
      Object.defineProperty(region, "scrollWidth", { value: 2000, configurable: true });
      Object.defineProperty(region, "clientWidth", { value: 400, configurable: true });

      await user.click(await screen.findByRole("button", { name: LABELS.explore }));
      // Capped to most of the viewport: the smaller of the diagram and 0.8 of the window.
      expect(await screen.findByTestId("scene")).toHaveAttribute("data-height", "800");

      setViewport(600);
      fireEvent(window, new Event("resize"));
      await waitFor(() =>
        expect(screen.getByTestId("scene")).toHaveAttribute("data-height", "480"),
      );

      setViewport(300);
      fireEvent(window, new Event("orientationchange"));
      // Never below the floor, however short the screen.
      await waitFor(() =>
        expect(screen.getByTestId("scene")).toHaveAttribute("data-height", "416"),
      );
    } finally {
      setViewport(initialHeight);
    }
  });

  // Value: protects=a lost chunk is logged, not swallowed; fails_when=the load catch drops the error silently again; why_new=failure tests only checked what the visitor sees; seam=none
  it("logs a chunk that fails to load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await renderViewer(<p>static diagram</p>, () => {
      throw new Error("chunk failed to load");
    });
    fireEvent.click(await screen.findByRole("button", { name: LABELS.explore }));
    expect(await screen.findByText(LABELS.failed)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("workflow scene failed to load", expect.any(Error));
  });

  it("starts fetching when keyboard focus reaches the button", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await screen.findByRole("button", { name: LABELS.explore });
    await user.tab();
    await waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("scene")).toBeNull();
  });
});
