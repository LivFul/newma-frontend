import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobProgress } from "@/app/(platform)/demo/jobs/_components/job-progress";
import { JobStateBadge } from "@/app/(platform)/demo/jobs/_components/job-state-badge";
import { StartJobForm } from "@/app/(platform)/demo/jobs/_components/start-job-form";
import { JOB_STATES, type Job, isTerminal, parseJobRequest } from "@/lib/demo/jobs";
import { expectNoAxeViolations } from "../ui/axe";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const job = (overrides: Partial<Job> = {}): Job => ({
  id: "job-1",
  kind: "screening",
  state: "RUNNING",
  progress: 0.42,
  attempts: 0,
  max_attempts: 3,
  due_at: null,
  idempotency_key: "k-1",
  payload: {},
  synthetic: true,
  tenant_id: "t-1",
  result: null,
  error: null,
  cost_credits: 0,
  budget_credits: null,
  created_at: "2030-01-01T00:00:00Z",
  updated_at: "2030-01-01T00:00:00Z",
  started_at: null,
  finished_at: null,
  ...overrides,
});

describe("job vocabulary", () => {
  it("knows the three terminal states", () => {
    expect(JOB_STATES.filter(isTerminal)).toEqual(["SUCCEEDED", "FAILED", "CANCELLED"]);
  });
  it("keeps budget_credits when given", () => {
    expect(
      parseJobRequest({ kind: "admet", payload: {}, idempotency_key: "k", budget_credits: 3 }),
    ).toEqual({ kind: "admet", payload: {}, idempotency_key: "k", budget_credits: 3 });
  });
});

describe("JobStateBadge", () => {
  it.each(JOB_STATES)("renders %s with hidden context", (state) => {
    const { unmount } = render(<JobStateBadge state={state} />);
    const badge = screen.getByTestId("job-state");
    expect(badge).toHaveTextContent(`State: ${state}`);
    expect(badge).toHaveAttribute("data-state", state);
    unmount();
  });
});

describe("JobProgress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders the progressbar, simulation labels and retry notice from the polled job", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(job({ attempts: 1, progress: 0.75 }))),
    );
    const { container } = render(<JobProgress id="job-1" initial={job()} />);
    await waitFor(() =>
      expect(screen.getByRole("progressbar", { name: "Job progress" })).toHaveAttribute(
        "aria-valuenow",
        "75",
      ),
    );
    expect(screen.getByText("Simulated workflow engine")).toBeInTheDocument();
    expect(screen.getByText("Simulated compute")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Retried 1 time");
    expect(screen.getByRole("button", { name: "Cancel job" })).toBeEnabled();
    await expectNoAxeViolations(container);
  });

  it("disables cancel on a terminal job and shows no retry notice without attempts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(job({ state: "SUCCEEDED", progress: 1 }))),
    );
    render(<JobProgress id="job-1" />);
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100"),
    );
    expect(screen.getByRole("button", { name: "Cancel job" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("posts the cancel through the BFF and refreshes", async () => {
    const fetchMock = vi.fn(async () => Response.json(job()));
    vi.stubGlobal("fetch", fetchMock);
    render(<JobProgress id="job-1" initial={job()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel job" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit | undefined][];
    expect(
      calls.some(([url, init]) => url === "/api/demo/jobs/job-1/cancel" && init?.method === "POST"),
    ).toBe(true);
  });
});

describe("StartJobForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("posts a screening request with a fresh idempotency key and the failure flag, then navigates", async () => {
    const fetchMock = vi.fn(async () => Response.json(job({ id: "job-9" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StartJobForm />);
    fireEvent.click(screen.getByRole("checkbox", { name: /inject one retried failure/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start simulated screening" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/demo/jobs/job-9"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/demo/jobs");
    const body = JSON.parse(String(init.body));
    expect(body.kind).toBe("screening");
    expect(body.payload).toEqual({ inject_failure: true });
    expect(body.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("shows an alert when the BFF rejects the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "x", message: "y" }, { status: 402 })),
    );
    render(<StartJobForm />);
    fireEvent.click(screen.getByRole("button", { name: "Start simulated screening" }));
    await screen.findByRole("alert");
    expect(push).not.toHaveBeenCalled();
  });
});
