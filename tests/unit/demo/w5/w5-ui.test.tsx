import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoopDiagram } from "@/app/(platform)/demo/w5-wet-lab/_components/loop-diagram";
import { MaterialGateResult } from "@/app/(platform)/demo/w5-wet-lab/_components/material-gate-result";
import { ElnRecordCard } from "@/app/(platform)/demo/w5-wet-lab/_components/eln-record-card";
import { LabWorkspace } from "@/app/(platform)/demo/w5-wet-lab/_components/lab-workspace";
import { ReconciliationTable } from "@/app/(platform)/demo/w5-wet-lab/_components/reconciliation-table";
import { RetrainingProposalCard } from "@/app/(platform)/demo/w5-wet-lab/_components/retraining-proposal";
import { WorkPackageForm } from "@/app/(platform)/demo/w5-wet-lab/_components/work-package-form";
import type { AssayImport, WorkPackage } from "@/lib/demo/types";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
  push.mockReset();
});

const wp = (over: Partial<WorkPackage> = {}): WorkPackage => ({
  id: "wp-1",
  candidate_id: "c-1",
  material_batch_id: "b-1",
  status: "results_available",
  loop_state: "wet_lab_validation",
  learning_loop_state: null,
  material_gate: { passed: true, reasons: [] },
  eln: { adapter_label: "Mock ELN", record_id: "ELN-1", revision: 1 },
  job_id: null,
  holds: [],
  created_at: "2030-01-01T00:00:00Z",
  ...over,
});

const imported = (over: Partial<AssayImport> = {}): AssayImport => ({
  id: "imp-1",
  work_package_id: "wp-1",
  eln_record_id: "ELN-1",
  eln_revision: 1,
  checksum_sha256: "c".repeat(64),
  duplicate_detection_key: "k",
  status: "quarantined",
  observation_ids: ["o1", "o2", "o3"],
  duplicate: false,
  ...over,
});

describe("LoopDiagram", () => {
  it("marks the current state of both branches", () => {
    render(<LoopDiagram assayState="confirmed_hit" learningState="prioritization" />);
    const assay = screen.getByRole("list", { name: "Assay branch" });
    expect(within(assay).getByText("confirmed hit").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    const learning = screen.getByRole("list", { name: "Learning branch" });
    expect(within(learning).getByText("prioritization").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("shows a hold explicitly", () => {
    render(<LoopDiagram assayState="hold" learningState={null} />);
    expect(screen.getByTestId("loop-hold")).toHaveTextContent("Hold");
  });
});

describe("cards", () => {
  it("material gate reasons and Mock ELN record distinct from scientist acceptance", () => {
    render(
      <MaterialGateResult
        gate={{
          passed: false,
          reasons: [{ code: "batch_unavailable", message: "Batch unavailable" }],
        }}
      />,
    );
    expect(screen.getByText(/batch_unavailable/)).toBeInTheDocument();
    render(
      <ElnRecordCard
        eln={{ adapter_label: "Mock ELN", record_id: "ELN-1", revision: 2 }}
        accepted={false}
      />,
    );
    expect(screen.getByText("Mock ELN")).toBeInTheDocument();
    expect(screen.getByText(/Recorded in Mock ELN/)).toHaveTextContent("revision 2");
    expect(screen.getByText("Not yet accepted by a NEWMA scientist")).toBeInTheDocument();
  });

  it("retraining card is blocked and surfaces the 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "retraining_not_authorized",
            message: "Retraining needs separate authorization.",
            details: {},
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(
      <RetrainingProposalCard
        proposal={{
          id: "rp-1",
          status: "blocked_pending_authorization",
          reason: "C-04",
          source_import_id: "imp-1",
          created_at: "2030-01-01T00:00:00Z",
        }}
      />,
    );
    expect(
      screen.getByText("Blocked pending separate authorization (IP C-04)"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Execute retraining" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("retraining_not_authorized");
  });

  it("reconciliation table shows HOLD and open dispositions", () => {
    render(
      <ReconciliationTable
        reconciliation={{
          work_package_id: "wp-1",
          status: "hold",
          items: [
            {
              id: "r-1",
              sample_ref: "S-03",
              status: "missing",
              disposition: null,
              owner_persona: "scientist",
              rationale: null,
            },
          ],
        }}
        canDispose
      />,
    );
    expect(screen.getByTestId("reconciliation-status")).toHaveTextContent("HOLD");
    expect(screen.getByRole("button", { name: "Record disposition for S-03" })).toBeInTheDocument();
  });
});

describe("LabWorkspace import, duplicate and acceptance", () => {
  it("shows the duplicate notice and an unchanged observation count", async () => {
    const fetchMock = vi
      .fn<(url: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json(imported(), { status: 201 }))
      .mockResolvedValueOnce(Response.json(imported({ duplicate: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LabWorkspace workPackage={wp()} candidateId="c-1" persona="wet_lab_cro" />);
    await user.click(screen.getByRole("button", { name: "Import results" }));
    expect(await screen.findByTestId("observation-count")).toHaveTextContent("3 observations");
    await user.click(screen.getByRole("button", { name: "Import results" }));
    expect(await screen.findByText("Duplicate import — no new observations")).toBeInTheDocument();
    expect(screen.getByTestId("observation-count")).toHaveTextContent("3 observations");
    expect(screen.getByText(/c{12}/)).toBeInTheDocument();
  });

  it("keeps the import across a persona switch so the scientist can accept, then links H2 to W4", async () => {
    const fetchMock = vi
      .fn<(url: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json(imported({ status: "reconciled" }), { status: 201 }))
      .mockResolvedValueOnce(
        Response.json({
          ...imported({ status: "accepted" }),
          gate_effect: { gate_id: "g-h2", stage: "H2", status_after: "PENDING" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { rerender } = render(
      <LabWorkspace workPackage={wp()} candidateId="c-1" persona="wet_lab_cro" />,
    );
    await user.click(screen.getByRole("button", { name: "Import results" }));
    await screen.findByTestId("observation-count");
    rerender(<LabWorkspace workPackage={wp()} candidateId="c-1" persona="scientist" />);
    await user.click(screen.getByRole("button", { name: "Accept results" }));
    await user.type(screen.getByLabelText("Rationale"), "Replicates consistent");
    await user.click(screen.getByRole("button", { name: "Confirm acceptance" }));
    expect(await screen.findByText(/Accepted by NEWMA scientist/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /H2 is now decidable/ })).toHaveAttribute(
      "href",
      "/demo/w4-gates/c-1",
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).idempotency_key).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it("flags a new ELN revision for re-review", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ record_id: "ELN-1", revision: 2, adapter_label: "Mock ELN" }),
      ),
    );
    const user = userEvent.setup();
    render(<LabWorkspace workPackage={wp()} candidateId="c-1" persona="wet_lab_cro" />);
    await user.click(
      screen.getByRole("button", { name: "Edit Mock ELN record (correct a value)" }),
    );
    expect(await screen.findByText("New revision 2 — re-review required")).toBeInTheDocument();
  });
});

describe("WorkPackageForm", () => {
  it("prefills from a W3 proposal and posts a work package", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async (url) =>
      url.startsWith("/api/demo/material-batches")
        ? Response.json({ items: [] })
        : Response.json(wp({ id: "wp-9", status: "executing" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <WorkPackageForm
        candidates={[
          {
            id: "c-1",
            compound_id: "x",
            display_id: "DEMO-C-003",
            rank: 2,
            current_stage: "H1",
            last_reviewed_update_at: null,
          },
        ]}
        batches={[
          {
            id: "b-1",
            compound_id: "x",
            batch_ref: "B-1",
            quantity_mg: 5,
            purity_synthetic: 0.98,
            availability: "available",
            identity_accepted: true,
            synthetic: true,
          },
        ]}
        proposal={{
          candidate_id: "c-1",
          compound_id: "x",
          display_id: "DEMO-C-003",
          estimated_cost_credits: 120,
          note: "Proposal only",
          material_batch_id: "b-1",
          hypothesis: "H from agent",
          assay_endpoint: "IC50",
          protocol_version: "v1",
          controls: ["vehicle"],
          concentrations_um: [1, 10],
          replicates: 3,
          deliverables: ["curve"],
        }}
        allowed
      />,
    );
    expect(screen.getByLabelText("Hypothesis")).toHaveValue("H from agent");
    await user.click(screen.getByRole("button", { name: "Submit work package" }));
    const call = fetchMock.mock.calls.find((c) => c[0] === "/api/demo/work-packages");
    expect(JSON.parse(String(call?.[1].body))).toMatchObject({
      candidate_id: "c-1",
      material_batch_id: "b-1",
      concentrations_um: [1, 10],
      controls: ["vehicle"],
      scenario: "standard",
    });
    expect(push).toHaveBeenCalledWith("/demo/w5-wet-lab/wp-9");
  });
});
