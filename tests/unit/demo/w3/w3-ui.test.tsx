import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentSteps } from "@/app/(platform)/demo/w3-agent/_components/agent-steps";
import { AgentView } from "@/app/(platform)/demo/w3-agent/_components/agent-view";
import { AgentQueryForm } from "@/app/(platform)/demo/w3-agent/_components/agent-query-form";
import { AgentConversation } from "@/app/(platform)/demo/w3-agent/_components/agent-conversation";
import type { AgentQuery, AgentStepKey } from "@/lib/demo/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

const KEYS: AgentStepKey[] = [
  "qualified_procedure",
  "policy_scope",
  "retrieval",
  "hypotheses",
  "screening_request",
  "budget_check",
  "docking_job",
  "admet_job",
  "ranking",
  "work_package_proposal",
];

const query = (over: Partial<AgentQuery> = {}): AgentQuery => ({
  id: "q-1",
  label: "Simulated agent",
  status: "completed",
  objective: "Rank fictional constituents",
  steps: KEYS.map((key) => ({
    key,
    title: `Step ${key}`,
    status: "done",
    detail: key === "docking_job" ? "succeeded after retrying after simulated failure" : "",
  })),
  retrieval_scope: {
    included: [
      {
        subject_id: "t-1",
        display_name: "Exemplaria viridis — fictional",
        evidence_label: "literature_reported",
      },
    ],
    withheld: [{ subject_id: "t-2", reason_code: "consent_withdrawn" }],
  },
  budget: { requested_credits: 60, estimated_credits: 60, remaining_quota: 400 },
  job_ids: ["j-1", "j-2"],
  hypotheses: [
    {
      rank: 1,
      compound_id: "c-1",
      display_id: "DEMO-C-003",
      target_id: "t",
      score_synthetic: -9.1,
      score_label: "Synthetic",
      evidence_label: "computational_prediction",
      uncertainty: 0.4,
      limitations: ["A docking score cannot establish biological activity"],
    },
  ],
  work_package_proposal: {
    material_batch_id: "b-1",
    cost_credits: 120,
    hypothesis: "DEMO-C-003 inhibits Target-α",
  },
  remediation: [],
  created_at: "2030-01-01T00:00:00Z",
  updated_at: "2030-01-01T00:00:00Z",
  ...over,
});

describe("AgentSteps", () => {
  it("renders the ten TA §2 steps in order with status text", () => {
    render(<AgentSteps steps={query().steps} />);
    const items = within(screen.getByRole("list", { name: "Agent steps" })).getAllByRole(
      "listitem",
    );
    expect(items.map((li) => li.getAttribute("data-step"))).toEqual(KEYS);
    expect(items[0]).toHaveTextContent("done");
  });
});

describe("AgentView", () => {
  it("labels the simulation, shows scope, synthetic scores and the proposal, and has no approve control", () => {
    render(<AgentView query={query()} retried />);
    expect(screen.getAllByText("Simulated agent").length).toBeGreaterThan(0);
    expect(screen.getByText("Simulated workflow engine")).toBeInTheDocument();
    expect(screen.getByText("Simulated compute")).toBeInTheDocument();
    expect(screen.getByText("Retried after simulated failure")).toBeInTheDocument();
    expect(screen.getByLabelText("withheld: t-2")).toHaveTextContent("withheld");
    expect(screen.getByText("consent_withdrawn")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Ranked hypotheses" })).getByText("Synthetic"),
    ).toBeInTheDocument();
    expect(screen.getByText("Agents recommend; scientists decide (ENT-05)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Submit as work package in W5" })).toHaveAttribute(
      "href",
      "/demo/w5-wet-lab?from=q-1",
    );
    expect(screen.getByText(/120 demo credits/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /approve|accept|advance/i })).toHaveLength(0);
  });

  it("shows remediation when held", () => {
    render(
      <AgentView
        query={query({
          status: "held",
          job_ids: [],
          hypotheses: [],
          work_package_proposal: null,
          remediation: ["raise budget_credits to ≥ 60"],
        })}
        retried={false}
      />,
    );
    const hold = screen.getByRole("region", { name: "Budget hold" });
    expect(hold).toHaveTextContent("Held");
    expect(hold).toHaveTextContent("raise budget_credits to ≥ 60");
    expect(hold).toHaveTextContent("No simulated jobs were submitted.");
  });
});

describe("AgentQueryForm", () => {
  it("submits the objective with a stable key and navigates to the query", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
      Response.json(query({ status: "running" }), { status: 202 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <AgentQueryForm targets={[{ id: "t-a", display_name: "Target-α — fictional" }]} allowed />,
    );
    const budget = screen.getByLabelText("Budget (demo credits)");
    await user.clear(budget);
    await user.type(budget, "10");
    await user.click(screen.getByRole("button", { name: "Ask the simulated agent" }));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({ target_id: "t-a", budget_credits: 10 });
    expect(body.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(push).toHaveBeenCalledWith("/demo/w3-agent?query=q-1");
  });
});

describe("W3 review fixes", () => {
  it("mints a new key after a successful query and refuses submission for other personas", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
      Response.json(query({ status: "running" }), { status: 202 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { rerender } = render(
      <AgentQueryForm targets={[{ id: "t-a", display_name: "Target-α — fictional" }]} allowed />,
    );
    await user.click(screen.getByRole("button", { name: "Ask the simulated agent" }));
    await user.click(screen.getByRole("button", { name: "Ask the simulated agent" }));
    const keys = fetchMock.mock.calls.map((c) => JSON.parse(String(c[1].body)).idempotency_key);
    expect(keys[0]).not.toBe(keys[1]);
    rerender(
      <AgentQueryForm
        targets={[{ id: "t-a", display_name: "Target-α — fictional" }]}
        allowed={false}
      />,
    );
    fetchMock.mockClear();
    (
      screen.getByRole("form", { name: "Ask the simulated agent" }) as HTMLFormElement
    ).requestSubmit();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not mistake retrieval details for a retry", () => {
    const steps = query().steps.map((s) => ({
      ...s,
      detail: s.key === "retrieval" ? "retrieved 5 subjects" : "",
    }));
    render(<AgentConversationProbe initial={query({ status: "held", steps })} />);
    expect(screen.queryByText("Retried after simulated failure")).toBeNull();
  });

  it("announces the query status in a live region", () => {
    render(
      <AgentView
        query={query({ status: "held", remediation: ["x"], job_ids: [] })}
        retried={false}
      />,
    );
    expect(screen.getByRole("status", { name: "Agent status" })).toHaveTextContent("held");
  });
});

function AgentConversationProbe({ initial }: { initial: AgentQuery }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(initial)),
  );
  return <AgentConversation id="q-1" initial={initial} />;
}
