import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TourPage from "@/app/(platform)/demo/tour/page";
import { TOUR_STEPS, tourMinutes } from "@/lib/demo/tour/steps";
import { TOUR_STORAGE_KEY, goTo, serializeState, startTour } from "@/lib/demo/tour/state";
import { writeRaw } from "@/lib/demo/tour/storage";
import { expectNoAxeViolations } from "../../ui/axe";

vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({
    persona: "scientist",
    tenant_id: "tenant-abc",
    expires_at: "2030-01-01T00:00:00.000Z",
    created_at: "2029-12-31T00:00:00.000Z",
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const config = {
  speed_factor: 4,
  server_speed_factor: 4,
  speed_source: "server_default",
  min_speed_factor: 1,
  max_speed_factor: 10,
};

describe("/demo/tour", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    writeRaw(null);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(config)),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    writeRaw(null);
  });

  it("introduces the tour with its length, the step list, the reset and speed controls", async () => {
    const { container } = render(await TourPage());
    expect(screen.getByRole("heading", { level: 1, name: "Guided tour" })).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`about ${Math.round(tourMinutes())} minutes`)),
    ).toBeVisible();
    const list = screen.getByRole("list", { name: "Tour steps" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(TOUR_STEPS.length);
    expect(within(list).getByText(/Licensing and benefit settlement/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo data" })).toBeInTheDocument();
    expect(await screen.findByText("Demo speed: 4×")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start tour" })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("starts the tour at step one and says where the panel is", async () => {
    render(await TourPage());
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    await waitFor(() => expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).not.toBeNull());
    expect(JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY)!)).toMatchObject({
      tenant_id: "tenant-abc",
      current: 0,
    });
    const progress = await screen.findByText(/in progress: step 1 of 16/i);
    await waitFor(() => expect(progress).toHaveFocus());
  });

  it("shows progress and a restart when a tour is already running", async () => {
    writeRaw(serializeState(goTo(startTour("tenant-abc"), 4)));
    render(await TourPage());
    expect(await screen.findByText(/in progress: step 5 of 16/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restart tour" }));
    await waitFor(() =>
      expect(JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY)!).current).toBe(0),
    );
  });
});
