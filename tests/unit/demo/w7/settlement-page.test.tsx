import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettlementPage from "@/app/(platform)/demo/w7-settlement/settlements/[settlementId]/page";
import type { PersonaId } from "@/lib/personas";
import { UUID, receipt, settlement } from "./fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const persona: PersonaId = "finance";
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona, tenant_id: "t", expires_at: "x", created_at: "x" }),
}));
const load = vi.fn();
vi.mock("@/lib/demo/server-data", () => ({ load: (path: string) => load(path) }));
afterEach(() => load.mockReset());

const seeded = settlement({
  id: UUID(31),
  display_id: "DEMO-S-001",
  license_id: null,
  license_display_id: null,
  state: "disputed",
  next_actions: ["resolve"],
  seeded_example: true,
  receipts: [
    receipt({ id: UUID(21), external_ref: "DEMO-R-001", amount_demo_credits: 400 }),
    receipt({
      id: UUID(22),
      external_ref: "DEMO-R-001",
      amount_demo_credits: 400,
      status: "duplicate",
      duplicate_of: UUID(21),
    }),
    receipt({
      id: UUID(23),
      external_ref: "DEMO-R-002",
      amount_demo_credits: 250,
      status: "disputed",
      dispute_reason: "Mismatch",
    }),
  ],
  totals: { recorded_demo_credits: 400, held_demo_credits: 250, duplicate_count: 1 },
  calculation: null,
});

const arm = (data: unknown, eventsResult: unknown) =>
  load.mockImplementation(async (path: string) =>
    path.endsWith("/events") ? eventsResult : { data },
  );
const renderPage = async (id = UUID(31)) =>
  render(await SettlementPage({ params: Promise.resolve({ settlementId: id }) }));

describe("settlement page", () => {
  it("renders the seeded disputed example with its badges and the no-events text", async () => {
    arm(seeded, { error: { code: "not_found", message: "Not found" } });
    const { container } = await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("DEMO-S-001");
    expect(screen.getByText("Seeded example")).toBeInTheDocument();
    expect(screen.getAllByTestId("synthetic-badge").length).toBeGreaterThan(0);
    expect(screen.getByText("No signed events: seeded example")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByTestId("receipt-row")).toHaveLength(3);
    expect(screen.getByTestId("receipt-totals")).toHaveTextContent(
      "250 demo credits held — not payable",
    );
    expect(screen.queryByRole("button", { name: /reconcile|approve|distribute/i })).toBeNull();
    expect(screen.getAllByText("Optional, simulated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo signature, not production key").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("%");
  });

  it("shows the same text when the seeded example answers an empty event list", async () => {
    arm(seeded, { data: { entity_type: "settlement", entity_id: "x", events: [] } });
    await renderPage();
    expect(screen.getByText("No signed events: seeded example")).toBeInTheDocument();
  });

  it("surfaces a failed settlement read as an error notice", async () => {
    arm(undefined, { data: { entity_type: "settlement", entity_id: "x", events: [] } });
    load.mockImplementation(async (path: string) =>
      path.endsWith("/events")
        ? { data: { entity_type: "settlement", entity_id: "x", events: [] } }
        : { error: { code: "not_found", message: "Settlement not found." } },
    );
    await renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("not_found");
  });

  it("404s on an unsafe id", async () => {
    await expect(
      SettlementPage({ params: Promise.resolve({ settlementId: "../x" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
