import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { W7StateBadge } from "@/app/(platform)/demo/w7-settlement/_components/state-badge";
import { W7_STATE_TONES } from "@/lib/demo/w7-status";

describe("W7 state badges (text and colour, never colour alone)", () => {
  it("maps every vocabulary value of the Contract", () => {
    expect(Object.keys(W7_STATE_TONES.settlement).sort()).toEqual(
      [
        "submitted",
        "reviewed",
        "approved",
        "disputed",
        "receipts_reconciled",
        "distribution_authorized",
        "funded",
        "paid",
        "audited",
        "paused",
      ].sort(),
    );
    expect(Object.keys(W7_STATE_TONES.license).sort()).toEqual(
      ["requested", "credential_check", "approved", "denied"].sort(),
    );
    expect(Object.keys(W7_STATE_TONES.receipt).sort()).toEqual([
      "disputed",
      "duplicate",
      "recorded",
    ]);
    expect(Object.keys(W7_STATE_TONES.benefit).sort()).toEqual([
      "delivered",
      "planned",
      "scheduled",
    ]);
    expect(Object.keys(W7_STATE_TONES.anchor).sort()).toEqual([
      "anchored",
      "not_requested",
      "pending",
    ]);
  });

  it("renders the humanised state text with a hidden 'Status:' prefix and a tone class", () => {
    const { container } = render(
      <W7StateBadge vocabulary="settlement" value="receipts_reconciled" />,
    );
    expect(screen.getByText("receipts reconciled")).toBeInTheDocument();
    expect(container).toHaveTextContent("Status: receipts reconciled");
    expect(container.firstElementChild).toHaveClass("border");
  });

  it("uses a warning tone for disputed and a danger tone for a duplicate receipt", () => {
    const a = render(<W7StateBadge vocabulary="settlement" value="disputed" />);
    expect(a.container.firstElementChild).toHaveClass("bg-warning");
    const b = render(<W7StateBadge vocabulary="receipt" value="duplicate" />);
    expect(b.container.firstElementChild).toHaveClass("bg-danger");
  });
});
