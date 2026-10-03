import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionBar } from "@/app/(platform)/demo/w7-settlement/_components/action-bar";
import { DisputeDialog } from "@/app/(platform)/demo/w7-settlement/_components/dispute-dialog";
import { RecordReceiptForm } from "@/app/(platform)/demo/w7-settlement/_components/record-receipt-form";
import { ReceiptsTable } from "@/app/(platform)/demo/w7-settlement/_components/receipts-table";
import { ResolveDialog } from "@/app/(platform)/demo/w7-settlement/_components/resolve-dialog";
import { StateStepper } from "@/app/(platform)/demo/w7-settlement/_components/state-stepper";
import type { Receipt, SettlementState } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { UUID, receipt, settlement } from "./fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const MACHINE = [
  "submitted",
  "reviewed",
  "approved",
  "receipts_reconciled",
  "distribution_authorized",
  "funded",
  "paid",
  "audited",
];

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body));

const original = receipt({ id: UUID(21), external_ref: "DEMO-R-001", amount_demo_credits: 400 });
const duplicate = receipt({
  id: UUID(22),
  external_ref: "DEMO-R-001",
  amount_demo_credits: 400,
  status: "duplicate",
  duplicate_of: UUID(21),
});
const disputed = receipt({
  id: UUID(23),
  external_ref: "DEMO-R-002",
  amount_demo_credits: 250,
  status: "disputed",
  dispute_reason: "Amount does not match the bank statement",
});

describe("StateStepper", () => {
  it("lists the eight machine states in order and marks the current one", () => {
    render(<StateStepper state="receipts_reconciled" />);
    const list = screen.getByRole("list", { name: "Settlement states" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-state"))).toEqual(MACHINE);
    const current = items.filter((li) => li.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("receipts reconciled");
    expect(items[0]).toHaveAttribute("data-done", "true");
    expect(items[7]).not.toHaveAttribute("data-done");
  });

  it("shows disputed and paused as side states, current when disputed", () => {
    render(<StateStepper state="disputed" />);
    const side = screen.getByRole("list", { name: "Side states" });
    const disputed = within(side).getByText("disputed").closest("li") as HTMLElement;
    expect(disputed).toHaveAttribute("aria-current", "step");
    expect(within(side).getByText("paused")).toBeInTheDocument();
    const main = within(screen.getByRole("list", { name: "Settlement states" })).getAllByRole(
      "listitem",
    );
    expect(main.some((li) => li.getAttribute("aria-current") === "step")).toBe(false);
  });
});

describe("ReceiptsTable (Review Focus 3 and 4)", () => {
  const renderTable = (receipts: readonly Receipt[], extra = {}) =>
    render(
      <ReceiptsTable
        receipts={receipts}
        totals={{ recorded_demo_credits: 400, held_demo_credits: 250, duplicate_count: 1 }}
        {...extra}
      />,
    );

  it("renders a duplicate struck through, rejected and not counted", () => {
    renderTable([original, duplicate, disputed]);
    const rows = screen.getAllByTestId("receipt-row");
    expect(rows.map((r) => r.getAttribute("data-status"))).toEqual([
      "recorded",
      "duplicate",
      "disputed",
    ]);
    expect(rows[1]).toHaveTextContent("rejected, not counted");
    expect(rows[1]).toHaveTextContent("duplicate of DEMO-R-001");
    expect(within(rows[1]).getByText("DEMO-R-001")).toHaveClass("line-through");
    expect(within(rows[0]).getByText("DEMO-R-001")).not.toHaveClass("line-through");
  });

  it("shows the disputed amount as held, with its reason", () => {
    renderTable([original, duplicate, disputed]);
    const row = screen.getAllByTestId("receipt-row")[2];
    expect(row).toHaveTextContent("held — not payable");
    expect(row).toHaveTextContent("Amount does not match the bank statement");
    expect(row).toHaveTextContent("250 demo credits");
  });

  it("totals come from the served totals, not from the duplicate row", () => {
    renderTable([original, duplicate, disputed]);
    const totals = screen.getByTestId("receipt-totals");
    expect(totals).toHaveTextContent("400 demo credits recorded");
    expect(totals).toHaveTextContent("250 demo credits held — not payable");
    expect(totals).toHaveTextContent("1 duplicate rejected");
  });

  it("highlights the original row of a duplicate refusal", () => {
    renderTable([original, duplicate], { highlightId: UUID(21) });
    const rows = screen.getAllByTestId("receipt-row");
    expect(rows[0]).toHaveAttribute("data-highlighted", "true");
    expect(rows[1]).not.toHaveAttribute("data-highlighted");
  });

  it("says when nothing has been recorded", () => {
    render(
      <ReceiptsTable
        receipts={[]}
        totals={{ recorded_demo_credits: 0, held_demo_credits: 0, duplicate_count: 0 }}
      />,
    );
    expect(screen.getByText("No receipts recorded yet.")).toBeInTheDocument();
  });
});

describe("RecordReceiptForm (A12)", () => {
  const duplicateRefusal = () =>
    Response.json(
      {
        code: "receipt_duplicate",
        message: "Duplicate.",
        details: { duplicate_of: UUID(21), receipt_id: UUID(22) },
      },
      { status: 409 },
    );

  const fill = async (user: ReturnType<typeof userEvent.setup>, ref: string, amount: string) => {
    await user.clear(screen.getByLabelText("Reference"));
    await user.type(screen.getByLabelText("Reference"), ref);
    await user.clear(screen.getByLabelText("Amount (demo credits)"));
    await user.type(screen.getByLabelText("Amount (demo credits)"), amount);
  };

  it("posts an integer amount with a key and refreshes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(receipt(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RecordReceiptForm settlementId={UUID(30)} allowed onDuplicate={vi.fn()} />);
    await fill(user, "DEMO-E2E-001", "600");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/receipts`);
    expect(bodyOf(fetchMock)).toMatchObject({
      external_ref: "DEMO-E2E-001",
      amount_demo_credits: 600,
    });
    expect(typeof bodyOf(fetchMock).idempotency_key).toBe("string");
  });

  it("rejects a non-integer amount client-side without any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RecordReceiptForm settlementId={UUID(30)} allowed onDuplicate={vi.fn()} />);
    await fill(user, "DEMO-E2E-001", "12.5");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("whole number of demo credits");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the duplicate refusal, highlights the original and refreshes the table", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(duplicateRefusal()));
    const onDuplicate = vi.fn();
    const user = userEvent.setup();
    render(<RecordReceiptForm settlementId={UUID(30)} allowed onDuplicate={onDuplicate} />);
    await fill(user, "DEMO-R-001", "400");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Duplicate receipt rejected — not counted",
    );
    expect(onDuplicate).toHaveBeenCalledWith(UUID(21));
    expect(refresh).toHaveBeenCalled();
  });

  it("a retry after a timeout reuses the key; an edit mints a new one (Review Focus 3)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(duplicateRefusal());
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RecordReceiptForm settlementId={UUID(30)} allowed onDuplicate={vi.fn()} />);
    await fill(user, "DEMO-R-001", "400");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodyOf(fetchMock, 1).idempotency_key).toBe(bodyOf(fetchMock, 0).idempotency_key);
    await fill(user, "DEMO-R-009", "400");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(bodyOf(fetchMock, 2).idempotency_key).not.toBe(bodyOf(fetchMock, 0).idempotency_key);
  });

  it("is inert with a reason when the persona or state does not allow it", () => {
    render(<RecordReceiptForm settlementId={UUID(30)} allowed={false} onDuplicate={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Record receipt" })).toBeDisabled();
    expect(screen.getByText(/Only Finance can do this/)).toBeInTheDocument();
  });
});

describe("ActionBar (controls = next_actions ∩ persona hint)", () => {
  const bar = (
    state: SettlementState,
    actions: readonly string[],
    persona: PersonaId = "finance",
    rest = {},
  ) =>
    render(
      <ActionBar
        settlement={settlement({
          state,
          next_actions: actions as never,
          receipts: [original, disputed],
          ...rest,
        })}
        persona={persona}
      />,
    );

  it("renders one control per allowed next action", () => {
    bar("reviewed", ["record_receipt", "dispute", "evidence_approval"]);
    expect(screen.getByRole("button", { name: "Dispute a receipt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve evidence" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark reviewed" })).toBeNull();
  });

  it("offers review at submitted", () => {
    bar("submitted", ["record_receipt", "review"]);
    expect(screen.getByRole("button", { name: "Mark reviewed" })).toBeInTheDocument();
  });

  it("offers no reconcile, approve or distribute control while disputed (Review Focus 4)", () => {
    bar("disputed", ["resolve"]);
    expect(screen.getByRole("button", { name: "Resolve a disputed receipt" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reconcile|approve|distribute|audit/i }),
    ).toBeNull();
    expect(screen.getByText(/Resolve the disputed receipt first/)).toBeInTheDocument();
  });

  it("explains why a persona sees no controls", () => {
    bar("reviewed", ["dispute", "evidence_approval"], "scientist");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/Only Finance can do this/)).toBeInTheDocument();
  });

  it("says there is nothing left once audited", () => {
    bar("audited", []);
    expect(screen.getByText(/No further actions/)).toBeInTheDocument();
  });
});

describe("DisputeDialog and ResolveDialog (A14, A15)", () => {
  it("disputes a chosen recorded receipt with a reason and one key across submits", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ code: "validation_error", message: "x", details: [] }, { status: 422 }),
      )
      .mockResolvedValueOnce(Response.json(settlement({ state: "disputed" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<DisputeDialog settlementId={UUID(30)} receipts={[original, duplicate, disputed]} />);
    await user.click(screen.getByRole("button", { name: "Dispute a receipt" }));
    const select = screen.getByLabelText("Receipt");
    expect(within(select).getAllByRole("option")).toHaveLength(1);
    await user.type(screen.getByLabelText("Reason"), "Amount mismatch");
    await user.click(screen.getByRole("button", { name: "Raise dispute" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Raise dispute" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(bodyOf(fetchMock, 0)).toMatchObject({ receipt_id: UUID(21), reason: "Amount mismatch" });
    expect(bodyOf(fetchMock, 1).idempotency_key).toBe(bodyOf(fetchMock, 0).idempotency_key);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/dispute`);
  });

  it("resolves a disputed receipt with a rationale", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(settlement({ state: "reviewed" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ResolveDialog settlementId={UUID(30)} receipts={[original, disputed]} />);
    await user.click(screen.getByRole("button", { name: "Resolve a disputed receipt" }));
    await user.type(screen.getByLabelText("Rationale"), "Statement corrected");
    await user.click(screen.getByRole("button", { name: "Reinstate receipt" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/resolve`);
    expect(bodyOf(fetchMock)).toMatchObject({
      receipt_id: UUID(23),
      rationale: "Statement corrected",
    });
  });

  it("is disabled with a reason when there is nothing to dispute or resolve", () => {
    const { unmount } = render(<DisputeDialog settlementId={UUID(30)} receipts={[duplicate]} />);
    expect(screen.getByRole("button", { name: "Dispute a receipt" })).toBeDisabled();
    expect(screen.getByText("There is no recorded receipt to dispute.")).toBeInTheDocument();
    unmount();
    render(<ResolveDialog settlementId={UUID(30)} receipts={[original]} />);
    expect(screen.getByRole("button", { name: "Resolve a disputed receipt" })).toBeDisabled();
    expect(screen.getByText("No receipt is disputed.")).toBeInTheDocument();
  });
});
