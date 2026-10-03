import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import W7Overview from "@/app/(platform)/demo/w7-settlement/page";
import type { PersonaId } from "@/lib/personas";
import { license, options } from "./fixtures";

let persona: PersonaId = "partner";
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona, tenant_id: "t", expires_at: "x", created_at: "x" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const load = vi.fn();
vi.mock("@/lib/demo/server-data", () => ({ load: (path: string) => load(path) }));

const settlements = {
  items: [
    {
      id: "s1",
      display_id: "DEMO-S-001",
      license_id: null,
      state: "disputed",
      recorded_demo_credits: 400,
      held_demo_credits: 250,
      seeded_example: true,
      created_at: "2030-01-01T00:00:00Z",
    },
    {
      id: "s2",
      display_id: "DEMO-S-002",
      license_id: "l1",
      state: "audited",
      recorded_demo_credits: 600,
      held_demo_credits: 0,
      seeded_example: false,
      created_at: "2030-01-02T00:00:00Z",
    },
  ],
};

beforeEach(() => {
  persona = "partner";
  load.mockReset();
  load.mockImplementation(async (path: string) => {
    if (path === "/v1/licenses/options") return { data: options() };
    if (path === "/v1/licenses") return { data: { items: [license()] } };
    if (path === "/v1/settlements") return { data: settlements };
    if (path === "/v1/demo/anchoring/outage")
      return { data: { active: false, label: "Optional, simulated", updated_at: null } };
    return { data: { items: [] } };
  });
});

describe("/demo/w7-settlement overview", () => {
  it("carries the header labels and the illustrative, demo-credit framing", async () => {
    const { container } = render(await W7Overview());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "W7 Licensing & benefit settlement",
    );
    expect(screen.getAllByText("Optional, simulated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo signature, not production key").length).toBeGreaterThan(0);
    expect(screen.getByText("Simulated workflow engine")).toBeInTheDocument();
    expect(container.textContent).not.toContain("%");
  });

  it("shows the request form to a partner", async () => {
    render(await W7Overview());
    expect(screen.getByRole("button", { name: "Request license" })).toBeInTheDocument();
    expect(screen.queryByText(/can do this/)).toBeNull();
  });

  it("shows only the persona notice to anyone else", async () => {
    persona = "scientist";
    render(await W7Overview());
    expect(screen.getByText(/Only Biopharma partner can do this/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request license" })).toBeNull();
  });

  it("lists licenses and settlements with state badges and the seeded example flagged", async () => {
    render(await W7Overview());
    const licenses = screen.getByRole("region", { name: "Licenses" });
    expect(within(licenses).getByRole("link", { name: /DEMO-L-001/ })).toHaveAttribute(
      "href",
      `/demo/w7-settlement/licenses/${license().id}`,
    );
    expect(within(licenses).getByText("requested")).toBeInTheDocument();
    const list = screen.getByRole("region", { name: "Settlements" });
    const seeded = within(list)
      .getByRole("link", { name: /DEMO-S-001/ })
      .closest("li") as HTMLElement;
    expect(seeded).toHaveTextContent("Seeded example");
    expect(within(seeded).getByTestId("synthetic-badge")).toBeInTheDocument();
    expect(seeded).toHaveTextContent("disputed");
    expect(seeded).toHaveTextContent("400 demo credits");
    expect(seeded).toHaveTextContent("250 demo credits held");
    expect(within(list).getByRole("link", { name: /DEMO-S-002/ })).toHaveAttribute(
      "href",
      "/demo/w7-settlement/settlements/s2",
    );
  });

  it("degrades to an error notice when a read fails", async () => {
    load.mockImplementation(async (path: string) =>
      path === "/v1/settlements"
        ? { error: { code: "upstream_error", message: "The demo backend is unavailable" } }
        : { data: path === "/v1/licenses/options" ? options() : { items: [] } },
    );
    render(await W7Overview());
    expect(screen.getByRole("alert")).toHaveTextContent("upstream_error");
  });

  it("says when there is nothing yet", async () => {
    load.mockImplementation(async (path: string) => ({
      data: path === "/v1/licenses/options" ? options() : { items: [] },
    }));
    render(await W7Overview());
    expect(screen.getByText("No licenses yet.")).toBeInTheDocument();
    expect(screen.getByText("No settlements yet.")).toBeInTheDocument();
  });
});
