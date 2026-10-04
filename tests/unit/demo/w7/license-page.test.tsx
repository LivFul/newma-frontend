import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LicensePage from "@/app/(platform)/demo/w7-settlement/licenses/[licenseId]/page";
import { CreateSettlementButton } from "@/app/(platform)/demo/w7-settlement/_components/create-settlement-button";
import { CredentialPanel } from "@/app/(platform)/demo/w7-settlement/_components/credential-panel";
import { DecisionDialog } from "@/app/(platform)/demo/w7-settlement/_components/decision-dialog";
import { EventList } from "@/app/(platform)/demo/w7-settlement/_components/event-list";
import type { PersonaId } from "@/lib/personas";
import { UUID, license } from "./fixtures";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
let persona: PersonaId = "tenant_admin";
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona, tenant_id: "t", expires_at: "x", created_at: "x" }),
}));
const load = vi.fn();
vi.mock("@/lib/demo/server-data", () => ({ load: (path: string) => load(path) }));

beforeEach(() => {
  persona = "tenant_admin";
});
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
  load.mockReset();
});

const verified = license({
  status: "credential_check",
  next_actions: ["decide"],
  credential: {
    status: "verified",
    label: "Optional, simulated",
    credential_ref: "DEMO-CRED-VALID-001",
    proof_ref: "DEMO-ZKP-1a2b3c4d",
    reason: null,
    checked_at: "2030-01-01T01:00:00Z",
  },
});
const failed = license({
  status: "credential_check",
  next_actions: ["decide"],
  credential: {
    status: "failed",
    label: "Optional, simulated",
    credential_ref: "DEMO-CRED-EXPIRED-001",
    proof_ref: "DEMO-ZKP-deadbeef",
    reason: "credential_expired",
    checked_at: "2030-01-01T01:00:00Z",
  },
});

const event = (seq: number) => ({
  id: UUID(100 + seq),
  seq,
  event_type: "license.requested",
  actor_persona: "partner",
  authority: "NEWMA",
  occurred_at: "2030-01-01T00:00:00Z",
  policy_version: "p1",
  entity_version: seq,
  payload: {},
  payload_sha256: "e".repeat(64),
  signature: "s",
  kid: "demo-key-1",
});

describe("CredentialPanel (A5, Optional, simulated)", () => {
  it("offers the check to partner and tenant admin, labelled optional and simulated", () => {
    render(<CredentialPanel license={license()} allowed />);
    expect(screen.getByText("Optional, simulated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run credential check" })).toBeEnabled();
    expect(screen.getByText(/optional and simulated/i)).toBeInTheDocument();
  });

  it("explains why the check is unavailable to other personas", () => {
    render(<CredentialPanel license={license()} allowed={false} />);
    expect(screen.getByRole("button", { name: "Run credential check" })).toBeDisabled();
    expect(
      screen.getByText(/Only Biopharma partner, Tenant admin can do this/),
    ).toBeInTheDocument();
  });

  it("explains when no credential reference was provided", () => {
    const noRef = license({ credential: { ...license().credential, credential_ref: null } });
    render(<CredentialPanel license={noRef} allowed />);
    expect(screen.getByRole("button", { name: "Run credential check" })).toBeDisabled();
    expect(screen.getByText(/No credential reference was provided/)).toBeInTheDocument();
  });

  it("shows Verified with the proof reference and no disclosed attributes", () => {
    render(<CredentialPanel license={verified} allowed />);
    expect(screen.getByTestId("credential-result")).toHaveTextContent("Verified");
    expect(screen.getByText("DEMO-ZKP-1a2b3c4d")).toBeInTheDocument();
    expect(screen.getByText("No attributes disclosed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run credential check" })).toBeNull();
  });

  it("shows Failed with the reason", () => {
    render(<CredentialPanel license={failed} allowed />);
    expect(screen.getByTestId("credential-result")).toHaveTextContent("Failed: credential expired");
  });

  it("posts the check to the license route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(verified));
    vi.stubGlobal("fetch", fetchMock);
    render(<CredentialPanel license={license()} allowed />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Run credential check" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/licenses/${UUID(10)}/credential-check`);
  });
});

describe("DecisionDialog (A6)", () => {
  const open = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Decide license" }));
    return user;
  };

  it("disables approve after a failed check and explains it; deny stays available", async () => {
    render(<DecisionDialog license={failed} allowed />);
    await open();
    expect(screen.getByRole("option", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Deny" })).toBeEnabled();
    expect(screen.getByLabelText("Decision")).toHaveValue("deny");
    expect(
      screen.getByText(/Approval is not possible after a failed credential check/),
    ).toBeInTheDocument();
  });

  it("sends one key across a double submit and the decision body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { code: "validation_error", message: "Short.", details: [] },
          { status: 422 },
        ),
      )
      .mockResolvedValueOnce(Response.json(license({ status: "approved" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<DecisionDialog license={verified} allowed />);
    const user = await open();
    await user.type(screen.getByLabelText("Rationale"), "Scope fits the agreement");
    await user.click(screen.getByRole("button", { name: "Record decision" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Record decision" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const bodies = fetchMock.mock.calls.map(([, init]) =>
      JSON.parse(String((init as RequestInit).body)),
    );
    expect(bodies[0]).toMatchObject({ decision: "approve", rationale: "Scope fits the agreement" });
    expect(bodies[1].idempotency_key).toBe(bodies[0].idempotency_key);
  });

  it("renders the policy reasons of license_rights_not_allowed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: "license_rights_not_allowed",
            message: "The rights policy does not allow this.",
            details: {
              policy_decision_id: "d1",
              reasons: [
                { code: "purpose_not_permitted", message: "Commercial use is not permitted" },
              ],
            },
          },
          { status: 409 },
        ),
      ),
    );
    render(<DecisionDialog license={license()} allowed />);
    const user = await open();
    await user.type(screen.getByLabelText("Rationale"), "Approve it");
    await user.click(screen.getByRole("button", { name: "Record decision" }));
    const list = await screen.findByRole("list", { name: "Policy reasons" });
    expect(within(list).getByText(/purpose_not_permitted/)).toBeInTheDocument();
    expect(list).toHaveTextContent("Commercial use is not permitted");
  });

  it("is disabled with a reason for other personas and once decided", () => {
    const { rerender } = render(<DecisionDialog license={license()} allowed={false} />);
    expect(screen.getByRole("button", { name: "Decide license" })).toBeDisabled();
    expect(screen.getByText(/Only Tenant admin can do this/)).toBeInTheDocument();
    rerender(
      <DecisionDialog license={license({ status: "approved", next_actions: [] })} allowed />,
    );
    expect(screen.getByRole("button", { name: "Decide license" })).toBeDisabled();
    expect(screen.getByText("This license has already been decided.")).toBeInTheDocument();
  });
});

describe("EventList", () => {
  it("lists events with persona, signature label and the W6 verification link", () => {
    render(<EventList events={[event(2), event(1)]} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("#1");
    expect(items[0]).toHaveTextContent("license.requested");
    expect(items[0]).toHaveTextContent("Biopharma partner");
    expect(within(items[0]).getByText("Demo signature, not production key")).toBeInTheDocument();
    expect(within(items[0]).getByRole("link", { name: /Verify event 1/ })).toHaveAttribute(
      "href",
      `/demo/w6-provenance/events/${UUID(101)}`,
    );
  });
  it("says so when there are none (seeded example)", () => {
    render(<EventList events={[]} emptyText="No signed events: seeded example" />);
    expect(screen.getByText("No signed events: seeded example")).toBeInTheDocument();
  });
});

describe("CreateSettlementButton (A9)", () => {
  it("navigates to the new settlement", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: "s-new" }, { status: 201 })),
    );
    render(<CreateSettlementButton licenseId={UUID(10)} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Create settlement" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/demo/w7-settlement/settlements/s-new"));
  });

  it("links to the existing settlement on settlement_exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { code: "settlement_exists", message: "Exists.", details: { settlement_id: "s-old" } },
            { status: 409 },
          ),
        ),
    );
    render(<CreateSettlementButton licenseId={UUID(10)} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Create settlement" }));
    const link = await screen.findByRole("link", { name: "Open the existing settlement" });
    expect(link).toHaveAttribute("href", "/demo/w7-settlement/settlements/s-old");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("license page", () => {
  const arm = (lic = license({ status: "approved", next_actions: [] })) =>
    load.mockImplementation(async (path: string) => {
      if (path.endsWith("/events"))
        return { data: { entity_type: "license", entity_id: lic.id, events: [event(1)] } };
      if (path.startsWith("/v1/benefits")) return { data: { items: [] } };
      return { data: lic };
    });
  const render_ = async () =>
    render(await LicensePage({ params: Promise.resolve({ licenseId: UUID(10) }) }));

  it("renders the summary, panels and events with the signature label", async () => {
    arm();
    const { container } = await render_();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("DEMO-L-001");
    expect(screen.getByText("Demo Biopharma Partner, fictional")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getAllByText(/agreement version 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Optional, simulated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo signature, not production key").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("%");
  });

  it("shows Create settlement to finance only when approved", async () => {
    persona = "finance";
    arm();
    await render_();
    expect(screen.getByRole("button", { name: "Create settlement" })).toBeInTheDocument();
  });

  it("hides Create settlement from other personas and while not approved", async () => {
    arm();
    const { unmount } = await render_();
    expect(screen.queryByRole("button", { name: "Create settlement" })).toBeNull();
    unmount();
    persona = "finance";
    arm(license());
    await render_();
    expect(screen.queryByRole("button", { name: "Create settlement" })).toBeNull();
  });

  it("404s on an unsafe id", async () => {
    await expect(LicensePage({ params: Promise.resolve({ licenseId: "../x" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
