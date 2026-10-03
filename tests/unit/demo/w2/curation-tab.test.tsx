import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Claim } from "@/lib/demo/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
const load = vi.fn();
vi.mock("@/lib/demo/server-data", () => ({ load }));
const { CurationTab } = await import("@/app/(platform)/demo/w2-evidence/_components/curation-tab");

const claim = (id: string, status: Claim["status"]): Claim => ({
  id,
  source_record_id: "s",
  subject_type: "compound",
  subject_id: "c",
  statement_synthetic: `claim ${id}`,
  source_location: "p. 1",
  extraction_method: "scripted_extraction_demo",
  evidence_label: "literature_reported",
  confidence: 0.8,
  status,
  quarantine_reason: null,
  reviewer_persona: null,
  reviewed_at: null,
  release_id: null,
});

const respond = (byStatus: Record<string, Claim[]>) =>
  load.mockImplementation(async (path: string, init?: { query?: { status?: string } }) => {
    if (path === "/v1/curation/source-records") return { data: { items: [] } };
    return { data: { items: byStatus[init?.query?.status ?? "all"] ?? [] } };
  });

describe("CurationTab", () => {
  beforeEach(() => load.mockReset());

  it("asks for pending_review and quarantined for the queue and approved for the release", async () => {
    respond({
      pending_review: [claim("p1", "pending_review")],
      quarantined: [claim("q1", "quarantined")],
      approved: [claim("a1", "approved")],
    });
    render(await CurationTab({ persona: "data_steward" }));
    const statuses = load.mock.calls
      .filter((c) => c[0] === "/v1/curation/queue")
      .map((c) => c[1]?.query?.status)
      .sort();
    expect(statuses).toEqual(["approved", "pending_review", "quarantined"]);
    expect(screen.getByText("claim p1")).toBeInTheDocument();
    expect(screen.getByText("claim q1")).toBeInTheDocument();
    expect(screen.queryByText("claim a1")).toBeNull();
    expect(screen.getByText(/1 approved claim ready for release/)).toBeInTheDocument();
  });

  it("says when a list hit the backend's 500-item cap", async () => {
    const many = Array.from({ length: 500 }, (_, i) => claim(`a${i}`, "approved"));
    respond({ approved: many });
    render(await CurationTab({ persona: "data_steward" }));
    expect(screen.getByText(/showing the first 500 approved claims/i)).toBeInTheDocument();
  });

  it("shows no cap notice below the cap", async () => {
    respond({ approved: [claim("a1", "approved")] });
    render(await CurationTab({ persona: "data_steward" }));
    expect(screen.queryByText(/showing the first 500/i)).toBeNull();
  });
});
