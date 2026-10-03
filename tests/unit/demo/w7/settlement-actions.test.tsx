import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionBar } from "@/app/(platform)/demo/w7-settlement/_components/action-bar";
import type { SettlementAction, SettlementState } from "@/lib/demo/types";
import type { PersonaId } from "@/lib/personas";
import { UUID, settlement } from "./fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const bar = (state: SettlementState, actions: SettlementAction[], persona: PersonaId = "finance") =>
  render(<ActionBar settlement={settlement({ state, next_actions: actions })} persona={persona} />);

describe("ActionBar: reconcile, distribute, audit", () => {
  it("offers reconcile at approved and posts to the reconcile route", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(settlement({ state: "receipts_reconciled" })));
    vi.stubGlobal("fetch", fetchMock);
    bar("approved", ["record_receipt", "reconcile"]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Reconcile receipts" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/reconcile`);
  });

  it("offers distribute in demo credits only once authorised", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(settlement({ state: "paid" })));
    vi.stubGlobal("fetch", fetchMock);
    bar("distribution_authorized", ["distribute"]);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Distribute (demo credits)" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/distribution`);
  });

  it("never lists approve_distribution in the bar (the approvals panel owns it)", () => {
    bar("receipts_reconciled", ["approve_distribution"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("audits with the optional, simulated anchor checked by default, and can opt out", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(settlement({ state: "audited" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    bar("paid", ["audit"]);
    await user.click(screen.getByRole("button", { name: "Final reconciliation and commitment" }));
    const box = screen.getByRole("checkbox", { name: "Anchor (optional, simulated)" });
    expect(box).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Run final reconciliation" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toMatchObject({
      anchor: true,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/demo/settlements/${UUID(30)}/audit`);
  });

  it("sends anchor false when the box is unchecked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(settlement({ state: "audited" })));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    bar("paid", ["audit"]);
    await user.click(screen.getByRole("button", { name: "Final reconciliation and commitment" }));
    await user.click(screen.getByRole("checkbox", { name: "Anchor (optional, simulated)" }));
    await user.click(screen.getByRole("button", { name: "Run final reconciliation" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)).anchor).toBe(false);
  });

  it("hides every finance control from other personas with an explanation", () => {
    bar("paid", ["audit"], "tenant_admin");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/Only Finance can do this/)).toBeInTheDocument();
  });
});
