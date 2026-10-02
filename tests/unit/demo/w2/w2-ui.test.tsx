import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CursorPager } from "@/app/(platform)/demo/w2-evidence/_components/cursor-pager";
import { EvidenceLegend } from "@/app/(platform)/demo/w2-evidence/_components/evidence-legend";
import {
  CompoundsTable,
  ObservationsTable,
  TaxaTable,
} from "@/app/(platform)/demo/w2-evidence/_components/evidence-table";
import { IngestPanel } from "@/app/(platform)/demo/w2-evidence/_components/ingest-panel";
import { ClaimReviewDialog } from "@/app/(platform)/demo/w2-evidence/_components/claim-review-dialog";
import { ReleasePanel } from "@/app/(platform)/demo/w2-evidence/_components/release-panel";
import { EVIDENCE_LABEL_TEXT } from "@/lib/evidence";
import type { Claim, Compound, Observation, SourceRecord } from "@/lib/demo/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const observation = (over: Partial<Observation> = {}): Observation => ({
  id: "o-1",
  compound_id: "c-1",
  target_id: "Target-α",
  endpoint: "IC50",
  value: 1.5,
  units: "µM",
  qualifier: "=",
  concentration_um: 10,
  replicate_index: 1,
  run_status: "completed",
  evidence_label: "measured_observation",
  out_of_domain: false,
  revision: 1,
  superseded: false,
  withheld_fields: [],
  synthetic: true,
  ...over,
});

const claim = (status: Claim["status"], id = "11111111-1111-4111-8111-111111111111"): Claim => ({
  id,
  source_record_id: "s",
  subject_type: "compound",
  subject_id: "c-1",
  statement_synthetic: "DEMO-C-003 reported in Exemplaria viridis — fictional",
  source_location: "p. 3, table 2",
  extraction_method: "scripted_extraction_demo",
  evidence_label: "literature_reported",
  confidence: 0.82,
  status,
  quarantine_reason: status === "quarantined" ? "ambiguous_stereochemistry" : null,
  reviewer_persona: null,
  reviewed_at: null,
  release_id: null,
});

describe("CursorPager", () => {
  it("links the next page through the URL and hides Next at the end", () => {
    const { rerender } = render(
      <CursorPager tab="taxa" nextCursor="eyJrIjoiYiJ9" cursor={undefined} />,
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/demo/w2-evidence?tab=taxa&cursor=eyJrIjoiYiJ9",
    );
    expect(screen.queryByRole("link", { name: "First page" })).toBeNull();
    rerender(<CursorPager tab="taxa" nextCursor={null} cursor="abc" />);
    expect(screen.queryByRole("link", { name: "Next page" })).toBeNull();
    expect(screen.getByRole("link", { name: "First page" })).toHaveAttribute(
      "href",
      "/demo/w2-evidence?tab=taxa",
    );
  });
});

describe("evidence tables", () => {
  it("legend lists all six labels", () => {
    render(<EvidenceLegend />);
    const legend = screen.getByRole("list", { name: "Evidence label legend" });
    for (const text of Object.values(EVIDENCE_LABEL_TEXT)) expect(legend).toHaveTextContent(text);
  });

  it("renders withheld cells and synthetic values", () => {
    render(
      <ObservationsTable
        items={[
          observation(),
          observation({
            id: "o-2",
            value: null,
            concentration_um: null,
            withheld_fields: ["value", "concentration_um"],
          }),
        ]}
      />,
    );
    expect(screen.getByLabelText("withheld: value")).toHaveTextContent("withheld");
    expect(screen.getByLabelText("withheld: concentration_um")).toBeInTheDocument();
    expect(screen.getAllByText("Synthetic").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("evidence-label")[0]).toHaveTextContent("Measured observation");
  });

  it("marks a quarantined compound", () => {
    const compound: Compound = {
      id: "c-1",
      display_id: "DEMO-C-007",
      identity_status: "tentatively_annotated",
      stereochemistry_status: "ambiguous",
      quarantined: true,
      evidence: [{ label: "tentative_annotation", claim_id: null, source_ref: null }],
      withheld_fields: [],
      synthetic: true,
    };
    render(<CompoundsTable items={[compound]} />);
    expect(screen.getByText("Quarantined — ambiguous stereochemistry")).toBeInTheDocument();
  });

  it("lists taxa with their evidence", () => {
    render(
      <TaxaTable
        items={[
          {
            id: "t",
            display_name: "Exemplaria viridis — fictional",
            accepted_name: "Exemplaria viridis",
            synonyms: ["E. v."],
            verification_status: "verified",
            evidence: [{ label: "literature_reported", claim_id: null, source_ref: null }],
            withheld_fields: ["restricted_location"],
            synthetic: true,
          },
        ]}
      />,
    );
    const table = screen.getByRole("table", { name: "Taxa" });
    expect(table).toHaveTextContent("Literature-reported");
    expect(within(table).getByLabelText("withheld: restricted_location")).toBeInTheDocument();
  });
});

describe("curation", () => {
  const source = (status: SourceRecord["clearance_status"]): SourceRecord => ({
    id: `22222222-2222-4222-8222-22222222222${status === "cleared" ? 1 : 2}`,
    title: `Synthetic survey (${status})`,
    source_type: "publication",
    source_ref: "DEMO-SRC",
    clearance_status: status,
    rights_record_id: null,
    synthetic: true,
  });

  it("shows a rejected-before-ingestion notice with policy reasons", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "source_not_cleared",
            message: "Not cleared.",
            details: {
              policy_decision_id: "d",
              reasons: [{ code: "no_rights_record", message: "No rights record." }],
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<IngestPanel sources={[source("uncleared")]} />);
    await user.click(screen.getByRole("button", { name: /Ingest Synthetic survey \(uncleared\)/ }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Rejected before ingestion");
    expect(alert).toHaveTextContent("no_rights_record");
    expect(alert).toHaveTextContent("No claims were created.");
  });

  it("reports the claims created by a cleared ingestion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            id: "run",
            source_record_id: "s",
            policy_decision_id: "d",
            claims: [claim("pending_review")],
          },
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<IngestPanel sources={[source("cleared")]} />);
    await user.click(screen.getByRole("button", { name: /Ingest Synthetic survey \(cleared\)/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("1 claim extracted");
    expect(refresh).toHaveBeenCalled();
  });

  it("renders the claim_quarantined refusal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "claim_quarantined", message: "The claim is quarantined.", details: {} },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ClaimReviewDialog claim={claim("quarantined")} allowed />);
    await user.click(screen.getByRole("button", { name: /Review claim/ }));
    await user.type(screen.getByLabelText("Rationale"), "Looks right");
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("claim_quarantined");
  });

  it("publishes a release of approved claims and shows version and manifest hash", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
      Response.json(
        {
          id: "rel",
          version: 1,
          claim_ids: ["x"],
          manifest_sha256: "ab".repeat(32),
          event_id: "e",
        },
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const approved = claim("approved");
    render(<ReleasePanel claims={[approved]} allowed />);
    await user.click(screen.getByRole("button", { name: "Publish curated release" }));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.claim_ids).toEqual([approved.id]);
    expect(body.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByRole("status")).toHaveTextContent("Release version 1");
    expect(screen.getByRole("status")).toHaveTextContent("ab".repeat(32));
  });
});
