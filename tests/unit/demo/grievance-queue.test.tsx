import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GrievanceQueue } from "@/app/(platform)/demo/w1-rights/_components/grievance-queue";
import { grievance } from "./p5b-fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("GrievanceQueue", () => {
  it("lists each grievance with record, category, status in words, raised time and description", () => {
    render(
      <GrievanceQueue
        grievances={[grievance(), grievance({ id: "grv-2", status: "acknowledged" })]}
        canAcknowledge={false}
      />,
    );
    const rows = screen.getAllByTestId("grievance-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Exemplaria viridis — fictional");
    expect(rows[0]).toHaveTextContent("A promise in the agreement was not kept");
    expect(rows[0]).toHaveTextContent("Open");
    expect(rows[0]).toHaveTextContent("The promised report did not arrive.");
    expect(rows[1]).toHaveTextContent("Acknowledged");
  });

  it("says when the queue is empty", () => {
    render(<GrievanceQueue grievances={[]} canAcknowledge />);
    expect(screen.getByText("No grievances in the queue.")).toBeInTheDocument();
  });

  it("offers Acknowledge only for an open grievance and only to the data steward", () => {
    const { rerender } = render(
      <GrievanceQueue
        grievances={[grievance(), grievance({ id: "grv-2", status: "acknowledged" })]}
        canAcknowledge
      />,
    );
    expect(screen.getAllByRole("button", { name: /Acknowledge/ })).toHaveLength(1);
    rerender(<GrievanceQueue grievances={[grievance()]} canAcknowledge={false} />);
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull();
  });

  it("posts the acknowledgement and refreshes", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "grv-1", status: "acknowledged" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<GrievanceQueue grievances={[grievance()]} canAcknowledge />);
    await user.click(screen.getByRole("button", { name: /Acknowledge/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/demo/grievances/grv-1/acknowledge",
      expect.objectContaining({ method: "POST" }),
    ]);
  });

  it("renders grievance_already_acknowledged and refreshes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "grievance_already_acknowledged", message: "Already acknowledged." },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<GrievanceQueue grievances={[grievance()]} canAcknowledge />);
    await user.click(screen.getByRole("button", { name: /Acknowledge/ }));
    const row = within(screen.getByTestId("grievance-row"));
    expect(await row.findByRole("alert")).toHaveTextContent("grievance_already_acknowledged");
    expect(refresh).toHaveBeenCalled();
  });
});
