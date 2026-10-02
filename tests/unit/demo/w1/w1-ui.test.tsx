import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DecisionCard } from "@/app/(platform)/demo/w1-rights/_components/decision-card";
import { WithdrawDialog } from "@/app/(platform)/demo/w1-rights/_components/withdraw-dialog";
import { CacheEntries } from "@/app/(platform)/demo/w1-rights/_components/cache-entries";
import { RightsTable } from "@/app/(platform)/demo/w1-rights/_components/rights-table";
import { PolicyEvaluator } from "@/app/(platform)/demo/w1-rights/_components/policy-evaluator";
import type { PolicyDecision, RightsRecord } from "@/lib/demo/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const decision = (
  value: PolicyDecision["decision"],
  code: string,
  remediation: string | null,
): PolicyDecision => ({
  id: "d-1",
  decision: value,
  reasons: [{ code, message: `${code} message`, rights_record_id: "r-1", remediation }],
  rights_record_ids: ["r-1"],
  policy_version: "demo-policy-1",
  inputs: {
    tenant_id: "t-1",
    persona: "community_liaison",
    purpose: "research",
    action: "retrieve",
    asset_type: "taxon",
    asset_id: "a-1",
    jurisdiction: null,
  },
  cache_entry_id: null,
  evaluated_at: "2030-01-01T00:00:00Z",
  event_id: "e-1",
});

const record = (status: RightsRecord["status"], id = "r-1"): RightsRecord => ({
  id,
  subject_type: "taxon",
  subject_id: `s-${id}`,
  subject_display_name: `Exemplaria viridis — fictional (${status})`,
  authority: "Community Cooperative A — fictional",
  permitted_uses: ["research"],
  restrictions: ["no_commercial_use"],
  jurisdiction: "XX",
  valid_from: "2026-01-01",
  valid_until: null,
  status,
  pic_reference: "PIC-DEMO-1",
  mat_reference: null,
  obligations: [],
  synthetic: true,
});

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("DecisionCard", () => {
  it.each([
    ["allow", "rights_valid_for_purpose", null],
    ["hold", "consent_expired", "Renew the consent record"],
    ["deny", "purpose_not_permitted", null],
  ] as const)("renders %s with its reason", (value, code, remediation) => {
    render(<DecisionCard decision={decision(value, code, remediation)} />);
    const card = screen.getByRole("region", { name: "Policy decision" });
    expect(within(card).getByTestId("policy-decision")).toHaveTextContent(value);
    expect(card).toHaveTextContent(code);
    expect(card).toHaveTextContent(`${code} message`);
    expect(card).toHaveTextContent("demo-policy-1");
    if (remediation) expect(card).toHaveTextContent(`Remediation: ${remediation}`);
  });
});

describe("WithdrawDialog", () => {
  it("requires a reason before posting, then refreshes", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        record: record("withdrawn"),
        invalidated_cache_entries: [{ id: "c" }],
        event_id: "e",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<WithdrawDialog record={record("valid")} allowed />);
    await user.click(screen.getByRole("button", { name: /Withdraw consent/ }));
    await user.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A reason is required.");
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Reason"), "Community withdrew consent");
    await user.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/demo/rights/records/r-1/withdraw",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Community withdrew consent" }),
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("is disabled with a notice for other personas", () => {
    render(<WithdrawDialog record={record("valid")} allowed={false} />);
    expect(screen.getByRole("button", { name: /Withdraw consent/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("CacheEntries and RightsTable", () => {
  it("shows invalidation state", () => {
    render(
      <CacheEntries
        entries={[
          {
            id: "c-1",
            subject_type: "taxon",
            subject_id: "s",
            purpose: "research",
            rights_record_id: "r",
            policy_decision_id: "d",
            created_at: "2030-01-01T00:00:00Z",
            invalidated_at: "2030-01-02T00:00:00Z",
            invalidation_reason: "consent_withdrawn",
          },
          {
            id: "c-2",
            subject_type: "taxon",
            subject_id: "s",
            purpose: "research",
            rights_record_id: "r",
            policy_decision_id: "d",
            created_at: "2030-01-01T00:00:00Z",
            invalidated_at: null,
            invalidation_reason: null,
          },
        ]}
      />,
    );
    expect(
      screen.getByText(/invalidated/i, { selector: "[data-testid=cache-state-c-1]" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("cache-state-c-1")).toHaveTextContent(
      "Invalidated: consent_withdrawn",
    );
    expect(screen.getByTestId("cache-state-c-2")).toHaveTextContent("Active");
  });

  it("lists records with status, uses and references", () => {
    render(<RightsTable records={[record("expired")]} canWithdraw={false} />);
    const table = screen.getByRole("table", { name: "Rights registry" });
    expect(table).toHaveTextContent("expired");
    expect(table).toHaveTextContent("research");
    expect(table).toHaveTextContent("no_commercial_use");
    expect(table).toHaveTextContent("PIC-DEMO-1");
    expect(table).toHaveTextContent("Synthetic");
  });
});

describe("PolicyEvaluator", () => {
  it("posts the chosen inputs and shows the decision", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
      Response.json(decision("allow", "rights_valid_for_purpose", null)),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <PolicyEvaluator records={[record("valid")]} tenantId="t-1" persona="community_liaison" />,
    );
    expect(screen.getByText("t-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Evaluate policy" }));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      purpose: "research",
      action: "retrieve",
      asset_type: "taxon",
      asset_id: "s-r-1",
    });
    expect(await screen.findByTestId("policy-decision")).toHaveTextContent("allow");
    expect(refresh).toHaveBeenCalled();
  });
});
