import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharterPanel } from "@/app/(platform)/demo/w9-campaign/_components/charter-panel";
import { JobProbe } from "@/app/(platform)/demo/w9-campaign/_components/job-probe";
import { ProtocolNote } from "@/app/(platform)/demo/w9-campaign/_components/protocol-note";
import { QuotaForm } from "@/app/(platform)/demo/w9-campaign/_components/quota-form";
import { QuotaPanel } from "@/app/(platform)/demo/w9-campaign/_components/quota-panel";
import { ThresholdForm } from "@/app/(platform)/demo/w9-campaign/_components/threshold-form";
import { VersionHistory } from "@/app/(platform)/demo/w9-campaign/_components/version-history";
import { campaign, charter, thresholds, usage } from "./p5b-fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call] as [string, RequestInit])[1].body)) as Record<
    string,
    unknown
  >;

const change = (
  outcome: "new_protocol_version" | "updated_open_version" | "unchanged",
  version: number,
  revision: number,
) => {
  const base = charter({ protocol_version: version });
  const head = { ...base.versions[0], version, revision, locked: false, bound_candidate_count: 0 };
  return {
    outcome,
    previous_version: outcome === "new_protocol_version" ? version - 1 : version,
    charter: { ...base, versions: [head, ...base.versions] },
    event_id: outcome === "unchanged" ? null : "evt-1",
  };
};

describe("CharterPanel and ProtocolNote", () => {
  it("reads Locked with the candidate count in words", () => {
    render(<CharterPanel charter={charter()} />);
    expect(screen.getByTestId("lock-badge")).toHaveTextContent(
      "Locked: 4 candidates were selected under this protocol",
    );
    expect(screen.getByText("Potency maximum (µM)")).toBeInTheDocument();
    expect(screen.getAllByTestId("synthetic-badge").length).toBeGreaterThan(0);
  });

  it("reads Open when no candidate is bound and singular for one", () => {
    const { rerender } = render(
      <CharterPanel charter={charter({ lock_state: "open", bound_candidate_count: 0 })} />,
    );
    expect(screen.getByTestId("lock-badge")).toHaveTextContent("Open: no candidates selected yet");
    rerender(<CharterPanel charter={charter({ bound_candidate_count: 1 })} />);
    expect(screen.getByTestId("lock-badge")).toHaveTextContent(
      "Locked: 1 candidate was selected under this protocol",
    );
  });

  it("shows the thresholds as a definition list including the controls flag and note", () => {
    render(
      <CharterPanel
        charter={charter({ thresholds: thresholds({ controls_required: false, note: "A note" }) })}
      />,
    );
    expect(screen.getByText("Controls required")).toBeInTheDocument();
    expect(screen.getByText("no")).toBeInTheDocument();
    expect(screen.getByText("A note")).toBeInTheDocument();
  });

  it("explains that candidates keep the protocol they were selected under", () => {
    render(<ProtocolNote />);
    expect(screen.getByText(/keep the protocol version/i)).toBeInTheDocument();
  });
});

describe("VersionHistory", () => {
  it("lists each version with its thresholds, revision, reason, lock state and signature label", () => {
    const history = change("new_protocol_version", 2, 1).charter.versions;
    render(<VersionHistory versions={history} />);
    const rows = screen.getAllByTestId("version-row");
    expect(rows.map((r) => r.getAttribute("data-version"))).toEqual(["2", "1"]);
    expect(rows[0]).toHaveTextContent("Open");
    expect(rows[1]).toHaveTextContent("Locked");
    expect(rows[1]).toHaveTextContent("Initial synthetic protocol");
    expect(rows[1]).toHaveTextContent("evt-c1");
    expect(screen.getByText("Demo signature, not production key")).toBeInTheDocument();
  });

  it("shows no event for an unsigned version", () => {
    const version = { ...charter().versions[0], event_id: null };
    render(<VersionHistory versions={[version]} />);
    expect(screen.getByTestId("version-row")).toHaveTextContent("not signed");
  });
});

describe("ThresholdForm", () => {
  const edit = async (user: ReturnType<typeof userEvent.setup>, reason = "tighten replicates") => {
    const replicates = screen.getByLabelText("Minimum replicates");
    await user.clear(replicates);
    await user.type(replicates, "5");
    await user.type(screen.getByLabelText("Reason for the change"), reason);
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
  };

  it("sends the thresholds, reason, current version and a key; says a new version was created", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(change("new_protocol_version", 2, 1), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await edit(user);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe("/api/demo/campaigns/camp-1/charter");
    expect(call[1].method).toBe("PUT");
    expect(bodyOf(fetchMock)).toMatchObject({
      thresholds: { potency_um_max: 10, replicates_min: 5, controls_required: true },
      change_reason: "tighten replicates",
      expected_version: 1,
    });
    expect(
      await screen.findByText("Protocol version 2 created, version 1 is unchanged"),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("states the other outcomes in words", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(change("updated_open_version", 2, 2)))
      .mockResolvedValueOnce(Response.json({ ...change("unchanged", 2, 2), event_id: null }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <ThresholdForm charter={charter({ protocol_version: 2, lock_state: "open" })} allowed />,
    );
    await edit(user);
    expect(await screen.findByText("Open version 2 updated (revision 2)")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Reason for the change"), "resubmit as is");
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
    expect(await screen.findByText("No change")).toBeInTheDocument();
  });

  it("rotates the key after a definitive answer but keeps it after a network failure", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(Response.json(change("new_protocol_version", 2, 1), { status: 201 }))
      .mockResolvedValueOnce(Response.json({ ...change("unchanged", 2, 1), event_id: null }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await edit(user);
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
    await screen.findByText(/Protocol version 2 created/);
    await user.type(screen.getByLabelText("Reason for the change"), "second attempt");
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const keys = [0, 1, 2].map((i) => bodyOf(fetchMock, i).idempotency_key);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it("ignores a double click while a request is in flight", async () => {
    let release: (r: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await user.type(screen.getByLabelText("Reason for the change"), "double click test");
    await user.dblClick(screen.getByRole("button", { name: "Save thresholds" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release(Response.json(change("new_protocol_version", 2, 1), { status: 201 }));
    await screen.findByText(/Protocol version 2 created/);
  });

  it("shows the current version on charter_version_conflict and refreshes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "charter_version_conflict", message: "Stale.", details: { current_version: 3 } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await edit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("version 3");
    expect(refresh).toHaveBeenCalled();
  });

  it("replaces the draft with the winning thresholds after a version conflict", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { code: "charter_version_conflict", message: "Stale.", details: { current_version: 3 } },
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          charter({ protocol_version: 3, thresholds: thresholds({ replicates_min: 8 }) }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await edit(user);
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.getByLabelText("Minimum replicates")).toHaveValue(8));
    expect(screen.getByLabelText("Reason for the change")).toHaveValue("tighten replicates");
  });

  it("validates the reason and the ranges before posting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed />);
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/reason/i);
    const potency = screen.getByLabelText("Potency maximum (µM)");
    await user.clear(potency);
    await user.type(potency, "5000");
    await user.type(screen.getByLabelText("Reason for the change"), "valid reason");
    await user.click(screen.getByRole("button", { name: "Save thresholds" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/potency/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is inert with a persona notice for other personas", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ThresholdForm charter={charter()} allowed={false} />);
    const submit = screen.getByRole("button", { name: "Save thresholds" });
    expect(submit).toHaveAttribute("aria-disabled", "true");
    await user.click(submit);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent("Tenant admin");
  });
});

describe("QuotaPanel", () => {
  it("shows quota, spent, reserved and remaining in demo credits with a text meter", () => {
    render(<QuotaPanel usage={usage()} />);
    const panel = screen.getByRole("region", { name: "Credit quota" });
    expect(panel).toHaveTextContent("1000 demo credits");
    expect(panel).toHaveTextContent("Spent");
    expect(panel).toHaveTextContent("150 demo credits");
    expect(panel).toHaveTextContent("Reserved");
    expect(screen.getByTestId("quota-meter")).toHaveTextContent(
      "800 of 1000 demo credits remaining",
    );
    expect(within(panel).getAllByTestId("synthetic-badge").length).toBeGreaterThan(0);
  });

  it("says exhausted in words and shows a negative remainder", () => {
    render(<QuotaPanel usage={usage({ remaining: -20, committed: 1020, exhausted: true })} />);
    expect(screen.getByTestId("quota-meter")).toHaveTextContent("Exhausted");
    expect(screen.getByTestId("quota-meter")).toHaveTextContent("-20");
  });

  it("lists per-kind rows and recent jobs with how each is counted", () => {
    render(<QuotaPanel usage={usage()} />);
    const kinds = within(screen.getByRole("table", { name: "Credits by kind" }));
    expect(kinds.getByRole("row", { name: /screening/ })).toHaveTextContent("3");
    const jobs = screen.getAllByTestId("usage-job");
    expect(jobs[0]).toHaveTextContent("spent");
    expect(jobs[1]).toHaveTextContent("reserved");
    expect(within(jobs[0]).getByRole("link")).toHaveAttribute("href", "/demo/jobs/job-1");
  });

  it("says when there are no jobs", () => {
    render(<QuotaPanel usage={usage({ jobs: [], by_kind: [] })} />);
    expect(screen.getByText("No jobs count against the quota yet.")).toBeInTheDocument();
  });
});

describe("QuotaForm", () => {
  it("puts the quota with a reason and reports the new remaining credits", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(campaign({ credit_quota: 200, committed: 200, remaining: 0, exhausted: true })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<QuotaForm campaignId="camp-1" current={1000} allowed />);
    const quota = screen.getByLabelText("Credit quota (demo credits)");
    expect(quota).toHaveValue(1000);
    await user.clear(quota);
    await user.type(quota, "200");
    await user.type(screen.getByLabelText("Reason for the quota"), "match committed");
    await user.click(screen.getByRole("button", { name: "Set quota" }));
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe("/api/demo/campaigns/camp-1/quota");
    expect(call[1].method).toBe("PUT");
    expect(bodyOf(fetchMock)).toEqual({ credit_quota: 200, reason: "match committed" });
    expect(await screen.findByText(/Quota set to 200 demo credits/)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("requires a reason and an integer 0-1,000,000", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<QuotaForm campaignId="camp-1" current={1000} allowed />);
    await user.click(screen.getByRole("button", { name: "Set quota" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/reason/i);
    const quota = screen.getByLabelText("Credit quota (demo credits)");
    await user.clear(quota);
    await user.type(quota, "2000000");
    await user.type(screen.getByLabelText("Reason for the quota"), "too big");
    await user.click(screen.getByRole("button", { name: "Set quota" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/0 and 1,000,000/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is inert with a notice for other personas", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<QuotaForm campaignId="camp-1" current={1000} allowed={false} />);
    await user.click(screen.getByRole("button", { name: "Set quota" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent("Tenant admin");
  });

  it("renders a backend 403 with who may act", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "persona_forbidden",
            message: "No.",
            details: { persona: "scientist", allowed: ["tenant_admin"] },
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<QuotaForm campaignId="camp-1" current={1000} allowed />);
    await user.type(screen.getByLabelText("Reason for the quota"), "force it");
    await user.click(screen.getByRole("button", { name: "Set quota" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Allowed: Tenant admin");
  });
});

describe("JobProbe", () => {
  it("starts a 10 demo credit job with one key and links to it", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "job-9" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<JobProbe />);
    await user.click(
      screen.getByRole("button", { name: /Start a simulated screening job, 10 demo credits/ }),
    );
    expect(bodyOf(fetchMock)).toMatchObject({
      kind: "screening",
      payload: { estimated_credits: 10 },
    });
    expect(await screen.findByRole("link", { name: /Open the job/ })).toHaveAttribute(
      "href",
      "/demo/jobs/job-9",
    );
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByTestId("simulated-label")).toHaveTextContent("Simulated compute");
  });

  it("renders quota_exhausted with the four numbers and no job", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "quota_exhausted",
            message: "Quota exhausted.",
            details: { credit_quota: 100, committed: 100, requested: 10, remaining: 0 },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<JobProbe />);
    await user.click(screen.getByRole("button", { name: /Start a simulated screening job/ }));
    const refusal = await screen.findByRole("alert");
    expect(refusal).toHaveTextContent("quota_exhausted");
    expect(refusal).toHaveTextContent("Quota: 100 demo credits");
    expect(refusal).toHaveTextContent("Committed: 100");
    expect(refusal).toHaveTextContent("Requested: 10");
    expect(refusal).toHaveTextContent("Remaining: 0");
    expect(refusal).toHaveTextContent("No job was created");
    expect(screen.queryByRole("link", { name: /Open the job/ })).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("reuses one key across a failed attempt and a retry, then mints a new one", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(Response.json({ id: "job-1" }, { status: 201 }))
      .mockResolvedValueOnce(Response.json({ id: "job-2" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<JobProbe />);
    const start = screen.getByRole("button", { name: /Start a simulated screening job/ });
    await user.click(start);
    await screen.findByRole("alert");
    await user.click(start);
    await screen.findByRole("link", { name: /Open the job/ });
    await user.click(start);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const keys = [0, 1, 2].map((i) => bodyOf(fetchMock, i).idempotency_key);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[1]);
  });
});
