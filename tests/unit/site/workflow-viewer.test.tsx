import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SCENE_MODULE = "@/components/workflow-3d/workflow-scene";
const sceneLoaded = vi.fn();

// Registered per test with doMock: Vitest caches a mock factory's result across resetModules, so a
// factory registered once would count only the first test's load.
function sceneFactory() {
  sceneLoaded();
  return {
    WorkflowScene: ({ aspect, onFailure }: { aspect: string; onFailure: () => void }) => (
      <div data-testid="scene" data-aspect={aspect}>
        <button type="button" onClick={onFailure}>
          scene failed
        </button>
      </div>
    ),
  };
}

const LABELS = {
  explore: "Explore it",
  close: "Back",
  loading: "Loading it",
  ready: "It is ready",
  failed: "It failed",
};

async function renderViewer(
  children: ReactNode = <p>static diagram</p>,
  factory: Parameters<typeof vi.doMock>[1] = sceneFactory,
) {
  // A fresh module registry gives each test its own shared request and its own mock load.
  vi.resetModules();
  vi.doMock(SCENE_MODULE, factory);
  const { WorkflowViewer } = await import("@/components/site/workflow-viewer");
  return render(
    <WorkflowViewer labels={LABELS} aspect="4 / 3">
      {children}
    </WorkflowViewer>,
  );
}

beforeEach(() => sceneLoaded.mockClear());

describe("WorkflowViewer", () => {
  it("shows the static diagram and an explore button, and loads nothing yet", async () => {
    await renderViewer();
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: LABELS.explore })).toBeInTheDocument();
    expect(sceneLoaded).not.toHaveBeenCalled();
    expect(screen.queryByTestId("scene")).toBeNull();
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
    outside.focus();
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("scene")).toBeInTheDocument();
    outside.remove();
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
    // The visitor can try again.
    expect(screen.getByRole("button", { name: LABELS.explore })).toBeInTheDocument();
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

  it("starts fetching when keyboard focus reaches the button", async () => {
    const user = userEvent.setup();
    await renderViewer();
    await screen.findByRole("button", { name: LABELS.explore });
    await user.tab();
    await waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("scene")).toBeNull();
  });
});
