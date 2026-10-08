// Value: protects=no-WebGL visitors get the diagram back with a failure notice from the real scene chunk; fails_when=WorkflowScene stops catching createStage errors or onFailure is unwired; why_new=viewer tests fake the scene and e2e skips without WebGL; seam=none
// Value: protects=Separate lanes toggle state, pad commands and scene teardown reach the controller; fails_when=aria-pressed or setSeparated drifts, pad is unwired, or dispose is skipped on close; why_new=e2e never presses Separate lanes, reset or a pad button and no unit test renders WorkflowScene; seam=none
// Value: protects=a WebGL context lost after start-up reports a retryable failure so the viewer restores the diagram; fails_when=onContextLost is not wired to onFailure("error"); why_new=context loss left a blank canvas announced as ready; seam=none
// Value: protects=closing the scene removes OrbitControls' document keydown listener; fails_when=teardown moves back to a passive effect, which runs after the canvas has left the document; why_new=each close leaked a listener and the controls in review; seam=none
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SceneOptions } from "@/components/workflow-3d/scene";
import { WORKFLOW_CONTROLS } from "@/content/home/workflow";

const SCENE = "@/components/workflow-3d/scene";
const STAGE = "@/components/workflow-3d/stage";
const VIEWER = "@/components/site/workflow-viewer";

const LABELS = {
  explore: WORKFLOW_CONTROLS.explore.text,
  close: WORKFLOW_CONTROLS.close.text,
  loading: WORKFLOW_CONTROLS.loading.text,
  ready: WORKFLOW_CONTROLS.ready.text,
  failed: WORKFLOW_CONTROLS.failed.text,
  unavailable: WORKFLOW_CONTROLS.unavailable.text,
};

afterEach(() => {
  vi.doUnmock(SCENE);
  vi.doUnmock("three");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("WorkflowScene without WebGL (the real chunk, the real renderer)", () => {
  it("hands the visitor back the diagram and says the view could not start", async () => {
    // jsdom has no WebGL context, exactly like a browser with WebGL disabled.
    vi.resetModules();
    const { WorkflowViewer } = await import(VIEWER);
    const user = userEvent.setup();
    const { container } = render(
      <WorkflowViewer labels={LABELS} aspect="4 / 3">
        <p>static diagram</p>
      </WorkflowViewer>,
    );

    await user.click(await screen.findByRole("button", { name: LABELS.explore }));

    expect(await screen.findByText(LABELS.failed, {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(container.querySelector("[data-workflow-scene]")).toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
    // Never announced as ready, and not offered again: the browser has no renderer to give.
    expect(screen.queryByText(LABELS.ready)).toBeNull();
    expect(screen.getByRole("button", { name: LABELS.unavailable })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("WorkflowScene teardown with the real stage and orbit controls", () => {
  it("removes the orbit controls' document keydown listener on close", async () => {
    vi.resetModules();
    // Only the renderer is faked (jsdom has no WebGL); the stage and OrbitControls are real.
    vi.doMock("three", async (importOriginal) => {
      const actual = await importOriginal<typeof import("three")>();
      class WebGLRenderer {
        domElement = document.createElement("canvas");
        toneMapping = 0;
        render() {}
        setSize() {}
        setDrawingBufferSize() {}
        dispose() {}
        forceContextLoss() {}
        setPixelRatio() {}
      }
      return { ...actual, WebGLRenderer };
    });
    vi.doMock(SCENE, async () => {
      const { createStage } = await import(STAGE);
      return {
        createWorkflowScene: (container: HTMLElement, options: SceneOptions) => {
          const stage = createStage(container, options);
          return {
            setNavigation: () => {},
            resetView: () => {},
            setSeparated: () => {},
            dispose: () => stage.dispose(),
          };
        },
      };
    });
    const observer = class {
      observe() {}
      disconnect() {}
    };
    vi.stubGlobal("ResizeObserver", observer);
    vi.stubGlobal("IntersectionObserver", observer);
    const added = vi.spyOn(document, "addEventListener");
    const removed = vi.spyOn(document, "removeEventListener");
    const { WorkflowScene } = await import("@/components/workflow-3d/workflow-scene");

    const { container, unmount } = render(
      <WorkflowScene aspect="4 / 3" onReady={vi.fn()} onFailure={vi.fn()} />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
    const keydown = added.mock.calls.filter(([type]) => type === "keydown");
    expect(keydown).toHaveLength(1);

    unmount();

    const [, listener] = keydown[0]!;
    expect(removed).toHaveBeenCalledWith("keydown", listener, { capture: true });
  });
});

describe("WorkflowScene wiring to the scene controller", () => {
  async function renderScene(height?: number) {
    const controller = {
      setNavigation: vi.fn(),
      resetView: vi.fn(),
      setSeparated: vi.fn(),
      dispose: vi.fn(),
    };
    const createWorkflowScene = vi.fn<
      (container: HTMLElement, options: SceneOptions) => typeof controller
    >(() => controller);
    vi.resetModules();
    vi.doMock(SCENE, () => ({ createWorkflowScene }));
    const { WorkflowScene } = await import("@/components/workflow-3d/workflow-scene");
    const onFailure = vi.fn();
    const onReady = vi.fn();
    const view = render(
      <WorkflowScene aspect="4 / 3" height={height} onReady={onReady} onFailure={onFailure} />,
    );
    return { controller, createWorkflowScene, onFailure, onReady, ...view };
  }

  it("reports a lost WebGL context as a retryable failure", async () => {
    const { createWorkflowScene, onFailure } = await renderScene();
    const options = createWorkflowScene.mock.calls[0]![1];

    act(() => options.onContextLost?.());

    expect(onFailure).toHaveBeenCalledExactlyOnceWith("error");
  });

  // Value: protects=the viewer hears ready only from a renderer that started, and the scene keeps the diagram's measured height; fails_when=onReady is skipped or called before createWorkflowScene, or the measured height is ignored; why_new=onReady and the height prop are new; seam=none
  it("reports ready once the scene exists and takes the measured height", async () => {
    const { onReady, onFailure, container } = await renderScene(612);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
    const box = container.querySelector<HTMLElement>("[data-workflow-scene]")!;
    expect(box.style.height).toBe("612px");
    expect(box.style.aspectRatio).toBe("");
  });

  // Value: protects=without a measurement the scene still has the diagram's proportions; fails_when=the aspect fallback is dropped; why_new=the box no longer has a fixed minimum height; seam=none
  it("falls back to the diagram's aspect ratio when there is no measurement", async () => {
    const { container } = await renderScene();
    const box = container.querySelector<HTMLElement>("[data-workflow-scene]")!;
    expect(box.style.aspectRatio).toBe("4 / 3");
    expect(box.style.height).toBe("");
  });

  // Value: protects=Separate lanes meets the forty-four pixel target size; fails_when=the min-h-11 class is dropped from the button; why_new=no test checked its size; seam=none
  it("gives Separate lanes a full-size touch target", async () => {
    await renderScene();
    expect(screen.getByRole("button", { name: WORKFLOW_CONTROLS.separate.text })).toHaveClass(
      "min-h-11",
    );
  });

  it("makes Separate lanes a pressed toggle that lifts and then lowers the lanes", async () => {
    const { controller, onFailure } = await renderScene();
    const toggle = screen.getByRole("button", { name: WORKFLOW_CONTROLS.separate.text });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(controller.setSeparated).toHaveBeenLastCalledWith(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(controller.setSeparated).toHaveBeenLastCalledWith(false);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("passes pad commands and reset to the scene, and tears the scene down on close", async () => {
    const { controller, unmount } = await renderScene();

    fireEvent.pointerDown(screen.getByRole("button", { name: WORKFLOW_CONTROLS.zoomIn.text }));
    expect(controller.setNavigation).toHaveBeenLastCalledWith("zoom-in");
    fireEvent.pointerUp(window);
    expect(controller.setNavigation).toHaveBeenLastCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: WORKFLOW_CONTROLS.reset.text }));
    expect(controller.resetView).toHaveBeenCalledTimes(1);

    unmount();
    expect(controller.dispose).toHaveBeenCalledTimes(1);
  });
});
