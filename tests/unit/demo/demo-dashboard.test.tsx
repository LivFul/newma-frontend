import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DemoDashboard from "@/app/(platform)/demo/page";
import { WORKFLOWS } from "@/lib/demo/workflows";

vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({
    persona: "finance",
    tenant_id: "tenant-abc",
    expires_at: "2030-01-01T00:00:00.000Z",
    created_at: "2029-12-31T00:00:00.000Z",
  }),
}));

describe("/demo dashboard", () => {
  it("shows the session facts, the W1–W10 index with linked workflows and a link to jobs", async () => {
    render(await DemoDashboard());
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("tenant-abc")).toBeInTheDocument();
    expect(WORKFLOWS.map((w) => w.id)).toEqual([
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W6",
      "W7",
      "W8",
      "W9",
      "W10",
    ]);
    for (const workflow of WORKFLOWS) {
      expect(screen.getByText(workflow.id)).toBeInTheDocument();
    }
    const linked = WORKFLOWS.filter((w) => w.href !== undefined).length;
    expect(screen.getAllByText("Available")).toHaveLength(linked);
    expect(screen.getAllByText("Arrives in P5")).toHaveLength(WORKFLOWS.length - linked);
    expect(screen.getByRole("link", { name: /Licensing & benefit settlement/ })).toHaveAttribute(
      "href",
      "/demo/w7-settlement",
    );
    expect(screen.getByRole("link", { name: /Rights & use authorization/ })).toHaveAttribute(
      "href",
      "/demo/w1-rights",
    );
    expect(screen.getByRole("link", { name: /Signed provenance/ })).toHaveAttribute(
      "href",
      "/demo/w6-provenance",
    );
    expect(screen.queryByRole("link", { name: /Custodian view/ })).toBeNull();
    expect(screen.getByRole("link", { name: /simulated jobs/i })).toHaveAttribute(
      "href",
      "/demo/jobs",
    );
  });
});
