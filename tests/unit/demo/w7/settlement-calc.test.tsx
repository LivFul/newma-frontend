import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnchorPanel } from "@/app/(platform)/demo/w7-settlement/_components/anchor-panel";
import { ApprovalsPanel } from "@/app/(platform)/demo/w7-settlement/_components/approvals-panel";
import { CalculationTable } from "@/app/(platform)/demo/w7-settlement/_components/calculation-table";
import { CommitmentCard } from "@/app/(platform)/demo/w7-settlement/_components/commitment-card";
import { LedgerTable } from "@/app/(platform)/demo/w7-settlement/_components/ledger-table";
import type { LedgerEntry, SettlementApproval, SettlementState } from "@/lib/demo/types";
import { UUID, anchor, calculation, commitment, settlement } from "./fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const line = (
  kind: "beneficiary" | "reserve" | "residual",
  amount: number,
  bp = 0,
  name: string | null = null,
) => ({
  kind,
  beneficiary_id: kind === "beneficiary" ? `b-${name}` : null,
  beneficiary_display_name: name,
  share_basis_points: bp,
  amount_demo_credits: amount,
});

describe("CalculationTable (Review Focus 1)", () => {
  it("renders the served lines in order with the illustrative caption and labels", () => {
    const { container } = render(<CalculationTable calculation={calculation()} />);
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Illustrative calculation — rules are illustrative, amounts in demo credits",
    );
    const rows = screen.getAllByTestId("calc-line");
    expect(rows.map((r) => r.getAttribute("data-kind"))).toEqual([
      "beneficiary",
      "beneficiary",
      "reserve",
      "residual",
    ]);
    expect(rows[0]).toHaveTextContent("Community Cooperative A, fictional");
    expect(rows[0]).toHaveTextContent("2,500 basis points");
    expect(rows[0]).toHaveTextContent("150 demo credits");
    expect(rows[2]).toHaveTextContent("Reserve (illustrative)");
    expect(rows[2]).toHaveTextContent("360 demo credits");
    expect(rows[3]).toHaveTextContent("Rounding residual (carried to the reserve pool)");
    expect(screen.getAllByTestId("illustrative-badge").length).toBeGreaterThan(0);
    expect(screen.getByTestId("calc-distributable")).toHaveTextContent("600 demo credits");
    expect(container.textContent).not.toContain("%");
  });

  it("states Conserved with the total for conserving lines", () => {
    render(<CalculationTable calculation={calculation()} />);
    const status = screen.getByTestId("conservation");
    expect(status).toHaveTextContent("Conserved: 600 demo credits");
    expect(status).not.toHaveAttribute("role", "alert");
  });

  it("handles the awkward 7 demo credits fixture", () => {
    const awkward = calculation({
      distributable_demo_credits: 7,
      lines: [
        line("beneficiary", 1, 2500, "a"),
        line("beneficiary", 1, 1500, "b"),
        line("reserve", 4, 6000),
        line("residual", 1),
      ],
    });
    render(<CalculationTable calculation={awkward} />);
    expect(screen.getByTestId("conservation")).toHaveTextContent("Conserved: 7 demo credits");
  });

  it("renders a visible alert for a broken fixture", () => {
    const broken = calculation({
      distributable_demo_credits: 600,
      lines: [line("beneficiary", 150, 2500, "a"), line("reserve", 360, 6000), line("residual", 0)],
    });
    render(<CalculationTable calculation={broken} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Not conserved");
    expect(alert).toHaveTextContent("510 demo credits");
    expect(alert).toHaveTextContent("600 demo credits");
  });

  it("keeps the held amount outside the distributable total", () => {
    render(
      <CalculationTable
        calculation={calculation({ held_demo_credits: 250, distributable_demo_credits: 600 })}
      />,
    );
    expect(screen.getByTestId("calc-distributable")).toHaveTextContent("600 demo credits");
    expect(screen.getByTestId("calc-held")).toHaveTextContent(
      "250 demo credits held — not payable",
    );
  });

  it("labels a preview and a frozen calculation", () => {
    const { rerender } = render(<CalculationTable calculation={calculation()} />);
    expect(screen.getByText("Live preview")).toBeInTheDocument();
    rerender(<CalculationTable calculation={calculation({ frozen: true })} />);
    expect(screen.getByText("Frozen at reconciliation")).toBeInTheDocument();
  });

  it("shows a truncated hash with a copy control", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<CalculationTable calculation={calculation()} />);
    expect(screen.getByText(/^cccccccccccc…$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy calculation SHA-256" }));
    expect(writeText).toHaveBeenCalledWith("c".repeat(64));
  });

  it("says there is no calculation before a receipt is recorded", () => {
    render(<CalculationTable calculation={null} />);
    expect(screen.getByText(/No calculation yet/)).toBeInTheDocument();
  });
});

const approval = (persona: string): SettlementApproval => ({
  persona,
  rationale: `${persona} checked`,
  calculation_sha256: "c".repeat(64),
  approved_at: "2030-01-01T02:00:00Z",
  event_id: UUID(50),
});

const reconciled = (
  items: SettlementApproval[] = [],
  state: SettlementState = "receipts_reconciled",
) =>
  settlement({
    state,
    next_actions: state === "receipts_reconciled" ? ["approve_distribution"] : [],
    calculation: calculation({ frozen: true }),
    approvals: { required: 2, eligible_personas: ["finance", "tenant_admin"], items },
  });

describe("ApprovalsPanel (Review Focus 2)", () => {
  it("explains the rule and shows 0 of 2 with the control for an eligible persona", () => {
    render(<ApprovalsPanel settlement={reconciled()} persona="finance" />);
    expect(
      screen.getByText(
        /two different approver personas \(Finance and Tenant admin\) must approve/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("approval-progress")).toHaveTextContent("0 of 2 approvals");
    expect(screen.getByRole("button", { name: "Approve distribution" })).toBeEnabled();
  });

  it("shows 1 of 2 and never says authorised after the first approval", () => {
    render(
      <ApprovalsPanel settlement={reconciled([approval("finance")])} persona="tenant_admin" />,
    );
    const progress = screen.getByTestId("approval-progress");
    expect(progress).toHaveTextContent(
      "1 of 2 approvals — a different approver persona must also approve",
    );
    expect(screen.queryByText(/authorised/i)).toBeNull();
    const list = screen.getByRole("list", { name: "Approvals" });
    expect(list).toHaveTextContent("Finance");
    expect(list).toHaveTextContent("finance checked");
    expect(screen.getByRole("button", { name: "Approve distribution" })).toBeEnabled();
  });

  it("disables the control for the persona that already approved, with the reason", () => {
    render(<ApprovalsPanel settlement={reconciled([approval("finance")])} persona="finance" />);
    expect(screen.getByRole("button", { name: "Approve distribution" })).toBeDisabled();
    expect(screen.getByText(/Finance has already approved/)).toBeInTheDocument();
  });

  it("lists both personas and says authorised after the second approval", () => {
    render(
      <ApprovalsPanel
        settlement={reconciled(
          [approval("finance"), approval("tenant_admin")],
          "distribution_authorized",
        )}
        persona="finance"
      />,
    );
    expect(screen.getByTestId("approval-progress")).toHaveTextContent("2 of 2 approvals");
    expect(screen.getByText("Distribution authorised")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Approvals" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Approve distribution" })).toBeNull();
  });

  it("offers no approval before reconciliation or while disputed", () => {
    render(
      <ApprovalsPanel
        settlement={settlement({
          state: "disputed",
          next_actions: ["resolve"],
          calculation: calculation(),
        })}
        persona="finance"
      />,
    );
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.getByText(/Approvals open once the receipts are reconciled/)).toBeInTheDocument();
  });

  it("explains a persona that is not an approver", () => {
    render(<ApprovalsPanel settlement={reconciled()} persona="scientist" />);
    expect(screen.getByRole("button", { name: "Approve distribution" })).toBeDisabled();
    expect(screen.getByText(/Only Finance, Tenant admin can do this/)).toBeInTheDocument();
  });

  it("approves the displayed hash with one key per open and renders approver_already_approved", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          code: "approver_already_approved",
          message: "Already.",
          details: { persona: "finance" },
        },
        { status: 409 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ApprovalsPanel settlement={reconciled()} persona="finance" />);
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    expect(screen.getByTestId("approve-hash")).toHaveTextContent("cccccccccccc…");
    await user.type(screen.getByLabelText("Rationale"), "Checked the split");
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("approver_already_approved");
    expect(alert).toHaveTextContent("Finance has already approved.");
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const bodies = fetchMock.mock.calls.map(([, init]) =>
      JSON.parse(String((init as RequestInit).body)),
    );
    expect(bodies[0]).toMatchObject({
      calculation_sha256: "c".repeat(64),
      rationale: "Checked the split",
    });
    expect(bodies[1].idempotency_key).toBe(bodies[0].idempotency_key);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/approvals`);
  });

  it("renders calculation_stale", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: "calculation_stale",
            message: "Stale.",
            details: { current_sha256: "f".repeat(64) },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ApprovalsPanel settlement={reconciled()} persona="finance" />);
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    await user.type(screen.getByLabelText("Rationale"), "Checked");
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The calculation changed (now ffffffffffff…)",
    );
  });
});

const entry = (
  kind: LedgerEntry["kind"],
  amount: number,
  name: string | null = null,
): LedgerEntry => ({
  id: `${kind}-${amount}`,
  kind,
  beneficiary_id: name ? `b-${name}` : null,
  beneficiary_display_name: name,
  share_basis_points: kind === "residual" ? 0 : 1000,
  amount_demo_credits: amount,
  posted_at: "2030-01-02T00:00:00Z",
  synthetic: true,
});

describe("LedgerTable (Review Focus 4)", () => {
  it("reads No payout when nothing has been posted", () => {
    render(<LedgerTable ledger={[]} calculation={calculation()} />);
    expect(screen.getByText("No payout: nothing has been posted")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("lists entries and the conserved sum against the distributable amount", () => {
    render(
      <LedgerTable
        ledger={[
          entry("beneficiary", 150, "A, fictional"),
          entry("beneficiary", 90, "B, fictional"),
          entry("reserve", 360),
          entry("residual", 0),
        ]}
        calculation={calculation({ frozen: true })}
      />,
    );
    expect(screen.getAllByTestId("ledger-row")).toHaveLength(4);
    expect(screen.getByTestId("ledger-conservation")).toHaveTextContent(
      "Conserved: 600 demo credits",
    );
  });

  it("alerts when the ledger does not sum to the distributable amount", () => {
    render(
      <LedgerTable
        ledger={[entry("beneficiary", 150, "A, fictional")]}
        calculation={calculation()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Not conserved");
  });
});

describe("CommitmentCard", () => {
  it("shows the signature fields, the demo-key label and the W6 link", () => {
    render(<CommitmentCard commitment={commitment()} />);
    expect(screen.getByText("Demo signature, not production key")).toBeInTheDocument();
    expect(screen.getByText("demo-key-1")).toBeInTheDocument();
    expect(screen.getByText(/^dddddddddddd…$/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Verify in W6" })).toHaveAttribute(
      "href",
      `/demo/w6-provenance/events/${UUID(40)}`,
    );
    expect(screen.getByTestId("commitment-summary")).toHaveTextContent("600 demo credits");
  });
});

describe("AnchorPanel (Optional, simulated)", () => {
  it("not_requested", () => {
    render(<AnchorPanel anchor={anchor()} audited />);
    expect(screen.getByText("Optional, simulated")).toBeInTheDocument();
    expect(screen.getByTestId("anchor-status")).toHaveTextContent("Not requested");
  });

  it("pending: names the job, the engine label and never blocks anything", () => {
    render(
      <AnchorPanel
        anchor={anchor({ status: "pending", job_id: UUID(60), job_state: "QUEUED" })}
        audited
      />,
    );
    const status = screen.getByTestId("anchor-status");
    expect(status).toHaveTextContent("Pending");
    expect(
      screen.getByText(
        /during a simulated chain outage it stays pending and nothing else is blocked/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Simulated workflow engine")).toBeInTheDocument();
    expect(screen.getByTestId("anchor-live")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("anchored shows the receipt reference", () => {
    render(
      <AnchorPanel
        anchor={anchor({
          status: "anchored",
          receipt_ref: "DEMO-ANCHOR-abcdef012345",
          anchored_at: "2030-01-03T00:00:00Z",
        })}
        audited
      />,
    );
    expect(screen.getByTestId("anchor-status")).toHaveTextContent("Anchored");
    expect(screen.getByText("DEMO-ANCHOR-abcdef012345")).toBeInTheDocument();
  });

  it("before final reconciliation it says anchoring is requested there", () => {
    render(<AnchorPanel anchor={anchor()} audited={false} />);
    expect(screen.getByTestId("anchor-status")).toHaveTextContent(
      "requested at final reconciliation",
    );
  });
});
