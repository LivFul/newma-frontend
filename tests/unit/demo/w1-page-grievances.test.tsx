import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RightsPage from "@/app/(platform)/demo/w1-rights/page";
import { grievance } from "./p5b-fixtures";

const state = vi.hoisted(() => ({ persona: "data_steward", paths: [] as string[] }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona: state.persona, tenant_id: "t" }),
}));
vi.mock("@/lib/demo/server-data", () => ({
  load: async (path: string) => {
    state.paths.push(path);
    if (path === "/v1/grievances") return { data: { items: [grievance()] } };
    if (path === "/v1/rights/records") {
      return { data: { items: [] } };
    }
    return { data: { items: [] } };
  },
}));

describe("W1 page grievance queue", () => {
  beforeEach(() => {
    state.paths = [];
  });

  it("reads the queue for the data steward, who can acknowledge", async () => {
    state.persona = "data_steward";
    render(await RightsPage());
    expect(state.paths).toContain("/v1/grievances");
    expect(screen.getByRole("heading", { name: "Grievance queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Acknowledge/ })).toBeInTheDocument();
  });

  it("reads the queue for the community liaison but offers no acknowledgement", async () => {
    state.persona = "community_liaison";
    render(await RightsPage());
    expect(state.paths).toContain("/v1/grievances");
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull();
  });

  it("does not request the queue for a partner and shows the persona notice", async () => {
    state.persona = "partner";
    render(await RightsPage());
    expect(state.paths).not.toContain("/v1/grievances");
    expect(screen.getAllByRole("note").some((n) => /Data steward/.test(n.textContent ?? ""))).toBe(
      true,
    );
  });
});
