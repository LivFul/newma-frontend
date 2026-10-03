import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CampaignPage from "@/app/(platform)/demo/w9-campaign/page";
import { campaign, charter, usage } from "./p5b-fixtures";

const state = vi.hoisted(() => ({
  persona: "tenant_admin",
  campaigns: [] as unknown[],
  error: undefined as undefined | { code: string; message: string },
  paths: [] as string[],
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona: state.persona, tenant_id: "t" }),
}));
vi.mock("@/lib/demo/server-data", () => ({
  load: async (path: string) => {
    state.paths.push(path);
    if (state.error) return { error: state.error };
    if (path === "/v1/campaigns") return { data: { items: state.campaigns } };
    if (path.endsWith("/charter")) return { data: charter() };
    return { data: usage() };
  },
}));

const page = async () => render(await CampaignPage());

describe("W9 page", () => {
  beforeEach(() => {
    state.persona = "tenant_admin";
    state.campaigns = [campaign()];
    state.error = undefined;
    state.paths = [];
  });

  it("reads the charter and the credit usage of the tenant's campaign", async () => {
    await page();
    expect(state.paths).toEqual([
      "/v1/campaigns",
      "/v1/campaigns/camp-1/charter",
      "/v1/campaigns/camp-1/credit-usage",
    ]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Campaign, quotas & cost");
    expect(screen.getByTestId("lock-badge")).toHaveTextContent("Locked");
    expect(screen.getByRole("region", { name: "Credit quota" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save thresholds" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByRole("button", { name: "Set quota" })).not.toHaveAttribute("aria-disabled");
    expect(
      screen.getByRole("button", { name: /Start a simulated screening job/ }),
    ).toBeInTheDocument();
  });

  it("disables both forms with a notice for a scientist but keeps the probe", async () => {
    state.persona = "scientist";
    await page();
    expect(screen.getByRole("button", { name: "Save thresholds" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Set quota" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getAllByRole("note").some((n) => /Tenant admin/.test(n.textContent ?? ""))).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: /Start a simulated screening job/ })).toBeEnabled();
  });

  it("renders a backend error and still offers the probe when there is no campaign", async () => {
    state.campaigns = [];
    state.error = { code: "upstream_error", message: "The demo backend is unavailable" };
    await page();
    expect(screen.getByRole("alert")).toHaveTextContent("upstream_error");
    expect(screen.queryByRole("region", { name: "Credit quota" })).toBeNull();
  });
});
