import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetPicker } from "@/app/(platform)/demo/w8-partner/_components/asset-picker";
import { EvidencePack } from "@/app/(platform)/demo/w8-partner/_components/evidence-pack";
import { toExportPackInfo } from "@/app/(platform)/demo/w8-partner/_components/export-pack-info";
import { PurposeTabs } from "@/app/(platform)/demo/w8-partner/_components/purpose-tabs";
import { ExportForm } from "@/app/(platform)/demo/w8-partner/_components/export-form";
import { ExportRefusal } from "@/app/(platform)/demo/w8-partner/_components/export-refusal";
import { ExportRegister } from "@/app/(platform)/demo/w8-partner/_components/export-register";
import { ExportResult } from "@/app/(platform)/demo/w8-partner/_components/export-result";
import { GoverningRights } from "@/app/(platform)/demo/w8-partner/_components/governing-rights";
import { StageTabs } from "@/app/(platform)/demo/w8-partner/_components/stage-tabs";
import { evidence, exportRecord, withheldField } from "./p5b-fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const lastBody = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call] as [string, RequestInit])[1].body)) as Record<
    string,
    unknown
  >;

describe("ExportForm", () => {
  const pack = evidence();

  it("prefills the fictional recipient and offers 7, 30 and 90 days", () => {
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    expect(screen.getByLabelText("Recipient")).toHaveValue("Partner Biologics A — fictional");
    const options = within(screen.getByLabelText("Expires in")).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["7 days", "30 days", "90 days"]);
  });

  it("refuses a recipient without the word fictional before submitting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    const recipient = screen.getByLabelText("Recipient");
    await user.clear(recipient);
    await user.type(recipient, "Real Pharma Inc");
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    expect(screen.getByRole("alert")).toHaveTextContent("fictional");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the default request: all fields omitted, stage, purpose and a UTC expiry of 30 days", async () => {
    const fetchMock = vi.fn(async () => Response.json(exportRecord(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const before = Date.now();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/demo/exports",
      expect.objectContaining({ method: "POST" }),
    ]);
    const body = lastBody(fetchMock);
    expect(body).toMatchObject({
      asset_id: "asset-1",
      stage: "H1",
      purpose: "research",
      recipient: "Partner Biologics A — fictional",
    });
    expect(body).not.toHaveProperty("field_paths");
    const expires = Date.parse(String(body.expires_at));
    const thirtyDays = 30 * 24 * 3600 * 1000;
    expect(expires - before).toBeGreaterThan(thirtyDays - 5000);
    expect(expires - before).toBeLessThan(thirtyDays + 60_000);
    expect(String(body.expires_at)).toMatch(/Z$/);
    expect(await screen.findByRole("region", { name: "Export issued" })).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("sends only the ticked fields and requires at least one", async () => {
    const fetchMock = vi.fn(async () => Response.json(exportRecord(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    const location = screen.getByRole("checkbox", { name: /Collection location/ });
    expect(location).toBeChecked();
    await user.click(location);
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock).field_paths).toEqual(["identity.name"]);

    fetchMock.mockClear();
    await user.click(screen.getByRole("checkbox", { name: /Compound name/ }));
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one field/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reuses one idempotency key across a failed submit and a retry, then mints a new one", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(Response.json(exportRecord(), { status: 201 }))
      .mockResolvedValueOnce(Response.json(exportRecord({ id: "exp-2" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    const submit = screen.getByRole("button", { name: "Issue export" });
    await user.click(submit);
    await screen.findByRole("alert");
    await user.click(submit);
    await screen.findByRole("region", { name: "Export issued" });
    await user.click(submit);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const keys = [0, 1, 2].map((i) => lastBody(fetchMock, i).idempotency_key);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("resends the same expiry on a retry and starts a new attempt when the form is edited", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("offline"))
        .mockRejectedValueOnce(new TypeError("offline"))
        .mockResolvedValue(Response.json(exportRecord(), { status: 201 }));
      vi.stubGlobal("fetch", fetchMock);
      vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
      const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
      render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
      const submit = screen.getByRole("button", { name: "Issue export" });
      await user.click(submit);
      await screen.findByRole("alert");
      vi.setSystemTime(new Date("2030-01-01T01:00:00Z"));
      await user.click(submit);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(lastBody(fetchMock, 1).expires_at).toBe(lastBody(fetchMock, 0).expires_at);
      expect(lastBody(fetchMock, 1).idempotency_key).toBe(lastBody(fetchMock, 0).idempotency_key);
      await user.selectOptions(screen.getByLabelText("Expires in"), "7");
      await user.click(submit);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      expect(lastBody(fetchMock, 2).idempotency_key).not.toBe(
        lastBody(fetchMock, 0).idempotency_key,
      );
      expect(lastBody(fetchMock, 2).expires_at).toBe("2030-01-08T01:00:00Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the purpose from the pack as text and sends it", async () => {
    const fetchMock = vi.fn(async () => Response.json(exportRecord(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(evidence({ purpose: "commercial" }))} allowed />);
    expect(screen.queryByLabelText("Purpose")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock).purpose).toBe("commercial");
  });

  it("drops the body of an issued card once the register says it is suspended", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(exportRecord(), { status: 201 })),
    );
    const user = userEvent.setup();
    const { rerender } = render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    const card = await screen.findByRole("region", { name: "Export issued" });
    expect(card).toHaveTextContent("Active");
    rerender(
      <ExportForm pack={toExportPackInfo(pack)} allowed liveStatuses={{ "exp-1": "suspended" }} />,
    );
    const stale = screen.getByRole("region", { name: "Export issued" });
    expect(stale).toHaveTextContent("Suspended");
    expect(within(stale).queryAllByTestId("field-disclosed")).toHaveLength(0);
  });

  it("ignores a second click while the first request is in flight", async () => {
    let release: (r: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    const submit = screen.getByRole("button", { name: "Issue export" });
    await user.dblClick(submit);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submit).toHaveAttribute("aria-busy", "true");
    release(Response.json(exportRecord(), { status: 201 }));
    await screen.findByRole("region", { name: "Export issued" });
  });

  it.each(["export_held", "export_denied"])(
    "renders the %s refusal with its reasons",
    async (code) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json(
            {
              code,
              message: "The export was refused.",
              details: {
                policy_decision_id: "dec-9",
                decision: code === "export_held" ? "hold" : "deny",
                reasons: [
                  {
                    code: "consent_withdrawn",
                    message: "Consent was withdrawn.",
                    remediation: "Ask the community liaison.",
                  },
                ],
              },
            },
            { status: 409 },
          ),
        ),
      );
      const user = userEvent.setup();
      render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
      await user.click(screen.getByRole("button", { name: "Issue export" }));
      const refusal = await screen.findByRole("alert", { name: "Export refused" });
      expect(refusal).toHaveTextContent("consent_withdrawn");
      expect(refusal).toHaveTextContent("Ask the community liaison.");
      expect(refusal).toHaveTextContent("No export was created");
      expect(refresh).toHaveBeenCalled();
    },
  );

  it("is disabled with the persona notice when the persona may not export and never posts", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed={false} />);
    const submit = screen.getByRole("button", { name: "Issue export" });
    expect(submit).toHaveAttribute("aria-disabled", "true");
    await user.click(submit);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent("Biopharma partner");
  });

  it("renders the backend persona_forbidden with who may act", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "persona_forbidden",
            message: "Persona not allowed.",
            details: { persona: "scientist", allowed: ["partner"] },
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ExportForm pack={toExportPackInfo(pack)} allowed />);
    await user.click(screen.getByRole("button", { name: "Issue export" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Biopharma partner");
  });
});

describe("PurposeTabs and the slim form props", () => {
  it("links one tab per purpose and marks the current one", () => {
    render(<PurposeTabs asset="asset-1" stage="H1" purpose="research" />);
    const nav = screen.getByRole("navigation", { name: "Purpose" });
    expect(within(nav).getByRole("link", { name: /research/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: /commercial/ })).toHaveAttribute(
      "href",
      "/demo/w8-partner?asset=asset-1&stage=H1&purpose=commercial",
    );
  });

  it("carries no field value into the client form props", () => {
    const hostile = evidence({ fields: [withheldField({ value: "TOP-SECRET" })] });
    expect(JSON.stringify(toExportPackInfo(hostile))).not.toContain("TOP-SECRET");
  });
});

describe("ExportResult", () => {
  it("lists disclosed and withheld rows, the signature label and the signed-events link", () => {
    render(<ExportResult record={exportRecord()} />);
    const card = screen.getByRole("region", { name: "Export issued" });
    expect(card).toHaveTextContent("Active");
    expect(card).toHaveTextContent("Partner Biologics A — fictional");
    expect(within(card).getAllByTestId("field-disclosed")).toHaveLength(1);
    const withheld = within(card).getByTestId("field-withheld");
    expect(withheld).toHaveTextContent("restricted_field");
    expect(card).toHaveTextContent("Demo signature, not production key");
    expect(within(card).getByRole("link", { name: "Show signed events" })).toHaveAttribute(
      "href",
      "/demo/w6-provenance/policy_decision/dec-1",
    );
  });

  it("never renders a hostile value on a withheld row", () => {
    const hostile = { ...withheldField(), value: "TOP-SECRET" };
    const { container } = render(<ExportResult record={exportRecord({ withheld: [hostile] })} />);
    expect(container).not.toHaveTextContent("TOP-SECRET");
  });
});

describe("ExportRefusal", () => {
  it("shows the decision, each reason and remediation, and that nothing was created", () => {
    render(
      <ExportRefusal
        message="Refused."
        details={{
          policy_decision_id: "d1",
          decision: "deny",
          reasons: [{ code: "consent_withdrawn", message: "m", remediation: "r" }],
        }}
      />,
    );
    const alert = screen.getByRole("alert", { name: "Export refused" });
    expect(alert).toHaveTextContent("deny");
    expect(alert).toHaveTextContent("consent_withdrawn");
    expect(alert).toHaveTextContent("r");
    expect(alert).toHaveTextContent("No export was created");
    expect(within(alert).getByRole("link", { name: "Show signed events" })).toHaveAttribute(
      "href",
      "/demo/w6-provenance/policy_decision/d1",
    );
  });

  it("copes with missing details", () => {
    render(<ExportRefusal message="Refused." details={undefined} />);
    expect(screen.getByRole("alert", { name: "Export refused" })).toHaveTextContent("Refused.");
  });
});

describe("ExportRegister", () => {
  const summary = (status: "active" | "expired" | "suspended", id: string) => ({
    id,
    asset_id: "asset-1",
    display_id: "DEMO-C-001",
    stage: "H1" as const,
    recipient: "Partner Biologics A — fictional",
    purpose: "research" as const,
    expires_at: "2030-02-01T00:00:00Z",
    status,
    created_at: "2030-01-01T00:00:00Z",
    disclosed_count: 3,
    withheld_count: 1,
  });

  it("shows each export with a text status and no body", () => {
    render(
      <ExportRegister
        exports={[summary("active", "e1"), summary("suspended", "e2"), summary("expired", "e3")]}
      />,
    );
    const rows = screen.getAllByTestId("export-row");
    expect(rows.map((r) => r.getAttribute("data-status"))).toEqual([
      "active",
      "suspended",
      "expired",
    ]);
    expect(rows[1]).toHaveTextContent("Suspended");
    expect(rows[1]).toHaveTextContent("3 disclosed");
    expect(rows[1]).toHaveTextContent("1 withheld");
    expect(screen.queryByTestId("field-disclosed")).toBeNull();
  });

  it("says so when there are no exports", () => {
    render(<ExportRegister exports={[]} />);
    expect(screen.getByText("No exports yet.")).toBeInTheDocument();
  });
});

describe("EvidencePack, StageTabs, GoverningRights, AssetPicker", () => {
  it("shows the collection location as withheld with code restricted_field", () => {
    render(<EvidencePack pack={evidence()} />);
    const row = screen.getByTestId("field-withheld");
    expect(row).toHaveTextContent("Collection location");
    expect(row).toHaveTextContent("withheld");
    expect(row).toHaveTextContent("restricted_field");
    expect(screen.getAllByTestId("synthetic-badge").length).toBeGreaterThan(0);
  });

  it("says a not-released stage is not released because the stage was not passed", () => {
    render(
      <EvidencePack
        pack={evidence({
          released: false,
          not_released_reason: { code: "stage_not_passed", message: "Gate H2 has not passed." },
        })}
      />,
    );
    expect(screen.getByText(/not released/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate H2 has not passed/)).toBeInTheDocument();
  });

  it("links one tab per available stage with released or not released text", () => {
    render(<StageTabs pack={evidence()} asset="asset-1" purpose="research" />);
    const nav = screen.getByRole("navigation", { name: "Stages" });
    const h1 = within(nav).getByRole("link", { name: /H1/ });
    expect(h1).toHaveTextContent("released");
    expect(h1).toHaveAttribute("href", "/demo/w8-partner?asset=asset-1&stage=H1&purpose=research");
    expect(h1).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /H2/ })).toHaveTextContent(
      "not released: stage not passed",
    );
  });

  it("shows the decision, the reasons and the governing record names", () => {
    render(
      <GoverningRights
        policy={evidence().policy}
        recordNames={{ "rec-1": "Exemplaria viridis — fictional" }}
      />,
    );
    const block = screen.getByRole("region", { name: "Governing rights" });
    expect(block).toHaveTextContent("allow");
    expect(block).toHaveTextContent("rights_valid_for_purpose");
    expect(block).toHaveTextContent("Exemplaria viridis — fictional");
  });

  it("falls back to the record id when the name is unknown", () => {
    render(<GoverningRights policy={evidence().policy} recordNames={{}} />);
    expect(screen.getByRole("region", { name: "Governing rights" })).toHaveTextContent("rec-1");
  });

  it("lists candidates as links and marks the selected one", () => {
    render(
      <AssetPicker
        candidates={[
          {
            id: "a",
            display_id: "DEMO-C-001",
            rank: 1,
            current_stage: "H1",
            compound_id: "c1",
            last_reviewed_update_at: null,
          },
          {
            id: "b",
            display_id: "DEMO-C-002",
            rank: 2,
            current_stage: "H1",
            compound_id: "c2",
            last_reviewed_update_at: null,
          },
        ]}
        selected="a"
        purpose="research"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Assets" });
    expect(within(nav).getByRole("link", { name: /DEMO-C-001/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: /DEMO-C-002/ })).toHaveAttribute(
      "href",
      "/demo/w8-partner?asset=b&purpose=research",
    );
  });
});
