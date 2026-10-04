import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// A scene chunk that fails to load: the module itself throws, as a network error would.
vi.mock("@/components/workflow-3d/workflow-scene", () => {
  throw new Error("chunk failed to load");
});

const LABELS = {
  explore: "Explore it",
  close: "Back",
  loading: "Loading it",
  ready: "It is ready",
  failed: "It failed",
  unavailable: "Not available",
};

describe("WorkflowViewer when the scene chunk fails to load", () => {
  it("keeps the diagram, reports the failure, and offers another try", async () => {
    const user = userEvent.setup();
    const { WorkflowViewer } = await import("@/components/site/workflow-viewer");
    render(
      <WorkflowViewer labels={LABELS} aspect="4 / 3">
        <p>static diagram</p>
      </WorkflowViewer>,
    );

    await user.click(await screen.findByRole("button", { name: LABELS.explore }));

    expect(await screen.findByText(LABELS.failed)).toBeInTheDocument();
    expect(screen.getByText("static diagram")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: LABELS.explore })).toBeInTheDocument();
  });
});
