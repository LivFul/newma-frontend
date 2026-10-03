import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RightsTable } from "@/app/(platform)/demo/w1-rights/_components/rights-table";
import type { RightsRecord } from "@/lib/demo/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const record = (id: string, open?: number): RightsRecord => ({
  id,
  subject_type: "taxon",
  subject_id: `s-${id}`,
  subject_display_name: `Subject ${id} — fictional`,
  authority: "Community Cooperative A — fictional",
  permitted_uses: ["research"],
  restrictions: [],
  jurisdiction: "XX",
  valid_from: "2026-01-01",
  valid_until: null,
  status: "valid",
  pic_reference: null,
  mat_reference: null,
  obligations: [],
  synthetic: true,
  open_grievance_count: open as number,
});

describe("RightsTable grievance indicator", () => {
  it("has a Grievances column with text for none, one and several open", () => {
    render(<RightsTable records={[record("a", 0), record("b", 1), record("c", 2)]} canWithdraw />);
    expect(screen.getByRole("columnheader", { name: "Grievances" })).toBeInTheDocument();
    const cell = (id: string) =>
      within(screen.getByText(`Subject ${id} — fictional`).closest("tr")!);
    expect(cell("a").getByTestId("grievance-indicator")).toHaveTextContent("None");
    expect(cell("b").getByTestId("grievance-indicator")).toHaveTextContent("1 open");
    expect(cell("c").getByTestId("grievance-indicator")).toHaveTextContent("2 open");
  });

  it("reads None when the backend has not sent the counter", () => {
    render(<RightsTable records={[record("a")]} canWithdraw />);
    expect(screen.getByTestId("grievance-indicator")).toHaveTextContent("None");
  });
});
