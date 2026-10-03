import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BenefitTracker } from "@/app/(platform)/demo/w7-settlement/_components/benefit-tracker";
import { BeneficiaryView } from "@/app/(platform)/demo/w7-settlement/_components/beneficiary-view";
import type { Beneficiary, BenefitItem } from "@/lib/demo/types";
import { UUID } from "./fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const item = (over: Partial<BenefitItem> = {}): BenefitItem => ({
  id: UUID(70),
  license_id: UUID(10),
  license_display_id: "DEMO-L-001",
  benefit_ref: "training_workshop",
  title: "Training workshop (illustrative)",
  status: "planned",
  scheduled_for: null,
  delivered_at: null,
  evidence_note: null,
  updated_by_persona: null,
  ...over,
});

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body));

describe("BenefitTracker", () => {
  it("lists the item with its status badge, Synthetic badge and no monetary value", () => {
    const { container } = render(<BenefitTracker items={[item()]} persona="community_liaison" />);
    const row = screen.getByTestId("benefit-item");
    expect(row).toHaveTextContent("Training workshop (illustrative)");
    expect(row).toHaveAttribute("data-status", "planned");
    expect(row).toHaveTextContent("planned");
    expect(screen.getByTestId("synthetic-badge")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/demo credits|%/);
  });

  it("schedules a planned item as a community liaison with a date and one key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ code: "validation_error", message: "x", details: [] }, { status: 422 }),
      )
      .mockResolvedValueOnce(
        Response.json(item({ status: "scheduled", scheduled_for: "2030-02-01" })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<BenefitTracker items={[item()]} persona="community_liaison" />);
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    await user.type(screen.getByLabelText("Scheduled for"), "2030-02-01");
    await user.click(screen.getByRole("button", { name: "Confirm schedule" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Confirm schedule" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/benefits/${UUID(70)}/schedule`);
    expect(bodyOf(fetchMock)).toMatchObject({ scheduled_for: "2030-02-01" });
    expect(bodyOf(fetchMock, 1).idempotency_key).toBe(bodyOf(fetchMock, 0).idempotency_key);
  });

  it("delivers a scheduled item with an evidence note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(item({ status: "delivered" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <BenefitTracker
        items={[item({ status: "scheduled", scheduled_for: "2030-02-01" })]}
        persona="community_liaison"
      />,
    );
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Mark delivered" }));
    await user.type(screen.getByLabelText("Evidence note"), "Attendance sheet filed");
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/benefits/${UUID(70)}/deliver`);
    expect(bodyOf(fetchMock)).toMatchObject({ evidence_note: "Attendance sheet filed" });
  });

  it("shows a delivered item read-only with its evidence", () => {
    render(
      <BenefitTracker
        items={[
          item({
            status: "delivered",
            scheduled_for: "2030-02-01",
            delivered_at: "2030-02-02T00:00:00Z",
            evidence_note: "Attendance sheet filed",
          }),
        ]}
        persona="community_liaison"
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/Attendance sheet filed/)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled for 2030-02-01/)).toBeInTheDocument();
  });

  it("is read-only text for other personas", () => {
    render(<BenefitTracker items={[item()]} persona="finance" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/Only Community liaison can do this/)).toBeInTheDocument();
  });

  it("renders benefit_state_conflict with the current state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: "benefit_state_conflict",
            message: "Conflict.",
            details: { state: "delivered" },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<BenefitTracker items={[item()]} persona="community_liaison" />);
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    await user.type(screen.getByLabelText("Scheduled for"), "2030-02-01");
    await user.click(screen.getByRole("button", { name: "Confirm schedule" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Benefit is delivered.");
  });

  it("explains an empty list", () => {
    render(<BenefitTracker items={[]} persona="community_liaison" />);
    expect(screen.getByText(/Benefit items appear when a license is approved/)).toBeInTheDocument();
  });
});

const coop = (over: Partial<Beneficiary> = {}): Beneficiary => ({
  id: "b-a",
  display_name: "Community Cooperative A, fictional",
  channel: "cooperative account (illustrative)",
  received_demo_credits: 1500,
  entries: [
    { settlement_id: UUID(30), settlement_display_id: "DEMO-S-002", amount_demo_credits: 1500 },
  ],
  synthetic: true,
  ...over,
});

describe("BeneficiaryView", () => {
  it("lists beneficiaries with formatted totals, entries linked to the settlement and Synthetic badges", () => {
    render(<BeneficiaryView beneficiaries={[coop()]} />);
    const card = screen.getByTestId("beneficiary");
    expect(card).toHaveTextContent("Community Cooperative A, fictional");
    expect(card).toHaveTextContent("1,500 demo credits");
    expect(screen.getByTestId("synthetic-badge")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /DEMO-S-002/ })).toHaveAttribute(
      "href",
      `/demo/w7-settlement/settlements/${UUID(30)}`,
    );
  });

  it("says No payout yet when nothing was received", () => {
    render(<BeneficiaryView beneficiaries={[coop({ received_demo_credits: 0, entries: [] })]} />);
    expect(screen.getByText("No payout yet")).toBeInTheDocument();
  });

  it("has an empty state", () => {
    render(<BeneficiaryView beneficiaries={[]} />);
    expect(screen.getByText("No beneficiaries to show.")).toBeInTheDocument();
  });
});
