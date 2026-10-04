import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PartnerPage from "@/app/(platform)/demo/w8-partner/page";
import { evidence as baseEvidence, withheldField } from "./p5b-fixtures";

const evidence = (over: Parameters<typeof baseEvidence>[0] = {}) => baseEvidence(over);

const state = vi.hoisted(() => ({
  persona: "partner",
  paths: [] as { path: string; query?: unknown }[],
  packError: undefined as undefined | { code: string; message: string },
  hostile: false,
  extraCandidates: [] as { id: string; display_id: string; rank: number; current_stage: string }[],
}));

const formProps = vi.hoisted(() => ({ last: undefined as unknown }));
vi.mock("@/app/(platform)/demo/w8-partner/_components/export-form", () => ({
  ExportForm: (props: { allowed: boolean }) => {
    formProps.last = props;
    return <button aria-disabled={!props.allowed || undefined}>Issue export</button>;
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona: state.persona, tenant_id: "t" }),
}));
vi.mock("@/lib/demo/server-data", () => ({
  load: async (path: string, init?: { query?: unknown }) => {
    state.paths.push({ path, query: init?.query });
    if (path === "/v1/candidates") {
      return {
        data: {
          items: [
            { id: "b", display_id: "DEMO-C-002", rank: 2, current_stage: "H1" },
            { id: "a", display_id: "DEMO-C-001", rank: 1, current_stage: "H1" },
            ...state.extraCandidates,
          ],
        },
      };
    }
    if (path.endsWith("/evidence")) {
      if (state.packError) return { error: state.packError };
      return {
        data: evidence({
          asset_id: "a",
          fields: state.hostile ? [withheldField({ value: "TOP-SECRET" })] : undefined,
        }),
      };
    }
    if (path === "/v1/exports") return { data: { items: [] } };
    return {
      data: { items: [{ id: "rec-1", subject_display_name: "Exemplaria viridis — fictional" }] },
    };
  },
}));

const render_ = async (params: Record<string, string> = {}) =>
  render(await PartnerPage({ searchParams: Promise.resolve(params) }));

describe("W8 page", () => {
  beforeEach(() => {
    state.persona = "partner";
    state.paths = [];
    state.packError = undefined;
    state.hostile = false;
    state.extraCandidates = [];
  });

  it("opens the rank-1 asset, reads the pack with the purpose and renders the sections", async () => {
    await render_();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Partner portal & controlled export",
    );
    expect(state.paths.find((p) => p.path.endsWith("/evidence"))).toEqual({
      path: "/v1/assets/a/evidence",
      query: { stage: undefined, purpose: "research" },
    });
    expect(screen.getByRole("region", { name: "Governing rights" })).toHaveTextContent(
      "Exemplaria viridis — fictional",
    );
    expect(screen.getByRole("button", { name: "Issue export" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByText("No exports yet.")).toBeInTheDocument();
  });

  it("nulls a hostile withheld value and never hands values to the client form", async () => {
    state.hostile = true;
    await render_();
    expect(JSON.stringify(formProps.last)).not.toContain("TOP-SECRET");
    expect(document.body).not.toHaveTextContent("TOP-SECRET");
  });

  it("falls back to rank 1 for an unknown asset and ignores an invalid stage and purpose", async () => {
    await render_({ asset: "../evil", stage: "H9", purpose: "x" });
    expect(state.paths.find((p) => p.path.endsWith("/evidence"))).toEqual({
      path: "/v1/assets/a/evidence",
      query: { stage: undefined, purpose: "research" },
    });
  });

  it("never sends an unsafe ?asset id on, even when the candidate list echoes it", async () => {
    state.extraCandidates = [
      { id: "../evil", display_id: "DEMO-C-000", rank: 0, current_stage: "H1" },
    ];
    await render_({ asset: "../evil" });
    const evidencePaths = state.paths.filter((p) => p.path.endsWith("/evidence"));
    expect(evidencePaths.map((p) => p.path)).toEqual(["/v1/assets/a/evidence"]);
  });

  it("skips an unsafe rank-1 candidate when falling back", async () => {
    state.extraCandidates = [{ id: "x/y", display_id: "DEMO-C-000", rank: 0, current_stage: "H1" }];
    await render_();
    const evidencePaths = state.paths.filter((p) => p.path.endsWith("/evidence"));
    expect(evidencePaths.map((p) => p.path)).toEqual(["/v1/assets/a/evidence"]);
  });

  it("passes a valid stage and purpose through", async () => {
    await render_({ asset: "b", stage: "H2", purpose: "commercial" });
    expect(state.paths.find((p) => p.path.endsWith("/evidence"))?.query).toEqual({
      stage: "H2",
      purpose: "commercial",
    });
    expect(state.paths.find((p) => p.path.endsWith("/evidence"))?.path).toBe(
      "/v1/assets/b/evidence",
    );
  });

  it("shows the form disabled for a tenant admin", async () => {
    state.persona = "tenant_admin";
    await render_();
    expect(screen.getByRole("button", { name: "Issue export" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows the persona notice and the backend 403 for a scientist", async () => {
    state.persona = "scientist";
    state.packError = { code: "persona_forbidden", message: "Persona not allowed." };
    await render_();
    expect(screen.getAllByRole("note")[0]).toHaveTextContent("Biopharma partner, Tenant admin");
    expect(screen.getByRole("alert")).toHaveTextContent("persona_forbidden");
    expect(screen.queryByRole("button", { name: "Issue export" })).toBeNull();
  });
});
