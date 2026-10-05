import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignDecisionDialog } from "@/app/(platform)/demo/w4-gates/_components/sign-decision-dialog";
import { GateTracker } from "@/app/(platform)/demo/w4-gates/_components/gate-tracker";
import { SignedDecisionCard } from "@/app/(platform)/demo/w4-gates/_components/signed-decision-card";
import { EvidenceDiffView } from "@/app/(platform)/demo/w4-gates/_components/evidence-diff";
import { GateErrorNotice } from "@/app/(platform)/demo/w4-gates/_components/missing-requirements";
import type { Gate, GateDecision } from "@/lib/demo/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const gate = (stage: Gate["stage"], status: Gate["status"], over: Partial<Gate> = {}): Gate => ({
  id: `g-${stage}`,
  stage,
  status,
  missing_requirements: [],
  checks: [],
  rationale: "",
  evidence_package_version: null,
  decided_at: null,
  signature: null,
  kid: null,
  ...over,
});

const signed: GateDecision = {
  id: "gd-1",
  gate_id: "g-H1",
  candidate_id: "c-2",
  stage: "H1",
  decision: "pass",
  status_after: "PASS",
  rationale: "ok",
  evidence_package_version: 1,
  manifest: {},
  manifest_sha256: "f".repeat(64),
  signature: "s".repeat(88),
  kid: "demo-key-1",
  signature_label: "Demo signature, not production key",
  event_id: "e-1",
  decided_at: "2030-01-01T00:00:00Z",
};

const dialogProps = {
  gate: gate("H1", "NOT_STARTED"),
  candidateDisplayId: "DEMO-C-002",
  versions: [1],
  allowed: true,
  onSigned: vi.fn(),
};

async function openAndFill(user: ReturnType<typeof userEvent.setup>, typed: string) {
  await user.click(screen.getByRole("button", { name: "Sign H1 decision" }));
  await user.type(screen.getByLabelText("Rationale"), "Identity accepted");
  await user.type(screen.getByLabelText(/Demo sign-in step-up/), typed);
}

describe("SignDecisionDialog", () => {
  it("keeps submit disabled until the typed id matches", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SignDecisionDialog {...dialogProps} />);
    await openAndFill(user, "DEMO-C-00");
    const submit = screen.getByRole("button", { name: "Sign decision" });
    expect(submit).toHaveAttribute("aria-disabled", "true");
    await user.type(screen.getByLabelText(/Demo sign-in step-up/), "2");
    expect(submit).not.toHaveAttribute("aria-disabled");
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Demo sign-in step-up: type the candidate id DEMO-C-002 to confirm",
    );
  });

  it("reuses one idempotency key across submits within one open", async () => {
    const fetchMock = vi
      .fn<(url: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        Response.json({ code: "upstream_error", message: "x" }, { status: 503 }),
      )
      .mockResolvedValueOnce(Response.json(signed, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const onSigned = vi.fn();
    const user = userEvent.setup();
    render(<SignDecisionDialog {...dialogProps} onSigned={onSigned} />);
    await openAndFill(user, "DEMO-C-002");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    const keys = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1].body)).idempotency_key,
    );
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      decision: "pass",
      evidence_package_version: 1,
      confirm_candidate_display_id: "DEMO-C-002",
    });
    expect(onSigned).toHaveBeenCalledWith(signed, false);
    expect(refresh).toHaveBeenCalled();
  });

  it("renders gate_requirements_missing as a list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "gate_requirements_missing",
            message: "Requirements missing.",
            details: {
              stage: "H2",
              missing_requirements: [
                "biological replicates identified",
                "fit and uncertainty reviewed",
              ],
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<SignDecisionDialog {...dialogProps} />);
    await openAndFill(user, "DEMO-C-002");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    const alert = await screen.findByRole("alert");
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["biological replicates identified", "fit and uncertainty reviewed"]);
  });

  it("is disabled for other personas", () => {
    render(<SignDecisionDialog {...dialogProps} allowed={false} />);
    expect(screen.getByRole("button", { name: "Sign H1 decision" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("GateTracker and cards", () => {
  it("shows H0–L1 with checks and greys L2 and D", () => {
    render(
      <GateTracker
        gates={[
          gate("H0", "PASS"),
          gate("H2", "HOLD", {
            missing_requirements: ["biological replicates identified"],
            checks: [{ code: "controls_qualified", passed: true, message: "Controls qualified" }],
          }),
          gate("L2", "NOT_STARTED"),
          gate("D", "NOT_STARTED"),
        ]}
        renderAction={() => null}
      />,
    );
    const tracker = screen.getByRole("list", { name: "Gate tracker" });
    expect(tracker).toHaveTextContent("PASS");
    expect(tracker).toHaveTextContent("Controls qualified: passed");
    expect(tracker).toHaveTextContent("biological replicates identified");
    expect(screen.getAllByText("not in demo scope")).toHaveLength(2);
  });

  it("signed card shows hash, kid and the demo signature label linking to W6", () => {
    render(<SignedDecisionCard decision={signed} replayed />);
    const card = screen.getByRole("region", { name: "Signed decision" });
    expect(card).toHaveTextContent("Demo signature, not production key");
    expect(card).toHaveTextContent("f".repeat(64));
    expect(card).toHaveTextContent("demo-key-1");
    expect(card).toHaveTextContent("Replayed: the original signed decision");
    expect(within(card).getByRole("link", { name: /provenance/i })).toHaveAttribute(
      "href",
      "/demo/w6-provenance/gate/g-H1",
    );
  });

  it("evidence diff lists added, removed and changed paths", () => {
    render(
      <EvidenceDiffView
        diff={{
          from_version: 1,
          stage: "H2",
          to_version: 2,
          added: [{ path: "replicates[1]", value: 2 }],
          removed: [],
          changed: [{ path: "fit.reviewed", before: false, after: true }],
        }}
      />,
    );
    const region = screen.getByRole("region", { name: "Evidence diff v1 → v2" });
    expect(region).toHaveTextContent("replicates[1]");
    expect(region).toHaveTextContent("fit.reviewed");
    expect(region).toHaveTextContent("false → true");
    expect(region).toHaveTextContent("Removed: none");
  });

  it("GateErrorNotice explains stale packages and undecidable gates", () => {
    const { rerender } = render(
      <GateErrorNotice
        error={{
          code: "evidence_package_stale",
          message: "Stale.",
          details: { current_version: 3 },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Current version: 3");
    rerender(
      <GateErrorNotice
        error={{
          code: "gate_not_decidable",
          message: "No.",
          details: { stage: "H2", status: "HOLD", reason: "earlier_stage_not_passed" },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("earlier_stage_not_passed");
  });
});

// Value: protects=a gate not yet started never reads as failed; unmet checks say not met yet, never failed; fails_when=pending prop dropped, so NOT_STARTED gates show failed; why_new=redesign added it; seam=none
describe("GateTracker check wording by gate status", () => {
  const checks = [
    { code: "identity", passed: true, message: "Identity verified" },
    { code: "controls", passed: false, message: "Controls qualified" },
  ];
  const renderGates = (...gates: Gate[]) =>
    render(<GateTracker gates={gates} renderAction={() => null} />);

  it("reports an unmet check on a NOT_STARTED gate as not met yet, not failed", () => {
    const { container } = renderGates(gate("H0", "NOT_STARTED", { checks }));
    const item = container.querySelector('[data-stage="H0"]')!;
    expect(item).toHaveTextContent("Identity verified: passed");
    expect(item).toHaveTextContent("Controls qualified: not met yet");
    expect(item).not.toHaveTextContent("failed");
  });

  it.each(["HOLD", "FAIL", "PASS"] as const)(
    "still reports an unmet check as failed on %s",
    (status) => {
      const { container } = renderGates(gate("H0", status, { checks }));
      const item = container.querySelector('[data-stage="H0"]')!;
      expect(item).toHaveTextContent("Controls qualified: failed");
      expect(item).not.toHaveTextContent("not met yet");
      expect(item.querySelector('li[data-passed="false"]')).not.toBeNull();
    },
  );
});

// Value: protects=a check mark only on PASS, a cross only on FAIL or INVALIDATED, and a missing in-scope stage says no gate record; fails_when=FAIL draws a check, or an omitted stage is called out of scope; why_new=status badge text stays correct when the benchmark mark is the wrong shape; seam=none
describe("GateTracker benchmark marks", () => {
  const markOf = (container: HTMLElement, stage: string): "check" | "cross" | "none" => {
    const item = [...container.querySelectorAll("li")].find(
      (li) => li.querySelector(".font-mono")?.textContent === stage,
    );
    expect(item, stage).toBeTruthy();
    const benchmark = [...item!.querySelectorAll(":scope > span[aria-hidden='true']")].find((el) =>
      el.classList.contains("rounded-full"),
    );
    const d = benchmark?.querySelector("path")?.getAttribute("d") ?? "";
    if (d.startsWith("M3 8.5")) return "check";
    if (d.startsWith("M4 4")) return "cross";
    expect(benchmark?.querySelector("svg") ?? null).toBeNull();
    return "none";
  };

  it("draws a check only after PASS and a cross only after FAIL or INVALIDATED", () => {
    const { container } = render(
      <GateTracker
        gates={[
          gate("H0", "PASS"),
          gate("H1", "FAIL"),
          gate("H2", "INVALIDATED"),
          gate("H3", "PENDING"),
          gate("L2", "PASS"),
        ]}
        renderAction={() => null}
      />,
    );
    expect(markOf(container, "H0")).toBe("check");
    expect(markOf(container, "H1")).toBe("cross");
    expect(markOf(container, "H2")).toBe("cross");
    expect(markOf(container, "H3")).toBe("none");
    const row = (stage: string) =>
      [...container.querySelectorAll("li")].find(
        (li) => li.querySelector(".font-mono")?.textContent === stage,
      )!;
    expect(markOf(container, "L1")).toBe("none");
    expect(row("L1")).toHaveTextContent("no gate record");
    expect(row("L1")).not.toHaveTextContent("not in demo scope");
    expect(markOf(container, "L2")).toBe("none");
    expect(row("L2")).toHaveTextContent("not in demo scope");
    expect(row("D")).toHaveTextContent("not in demo scope");
  });
});

describe("W4 review fixes", () => {
  it("cannot be closed and reopened (new key) while a decision is in flight", async () => {
    let release: (r: Response) => void = () => undefined;
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SignDecisionDialog {...dialogProps} />);
    await openAndFill(user, "DEMO-C-002");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    release(Response.json(signed, { status: 201 }));
  });

  it("re-keys after a definite 4xx refusal so an edited retry is a new request", async () => {
    const fetchMock = vi
      .fn<(url: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        Response.json(
          { code: "evidence_package_stale", message: "Stale.", details: { current_version: 2 } },
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(Response.json(signed, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SignDecisionDialog {...dialogProps} />);
    await openAndFill(user, "DEMO-C-002");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Sign decision" }));
    const keys = fetchMock.mock.calls.map((c) => JSON.parse(String(c[1].body)).idempotency_key);
    expect(keys[0]).not.toBe(keys[1]);
  });
});
