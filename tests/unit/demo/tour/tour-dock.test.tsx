import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TourDock } from "@/app/(platform)/demo/_components/tour-dock";
import { TOUR_STEPS } from "@/lib/demo/tour/steps";
import { TOUR_STORAGE_KEY, goTo, markDone, serializeState, startTour } from "@/lib/demo/tour/state";
import { writeRaw } from "@/lib/demo/tour/storage";
import { expectNoAxeViolations } from "../../ui/axe";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const panelLoaded = vi.fn();
vi.mock("@/app/(platform)/demo/_components/tour-panel", async (importOriginal) => {
  panelLoaded();
  return importOriginal();
});

const TENANT = "tenant-abc";
const stored = (state = startTour(TENANT)) => writeRaw(serializeState(state));
const dock = (persona: "scientist" | "scientific_approver" = "scientist") =>
  render(<TourDock tenantId={TENANT} persona={persona} />);

describe("TourDock", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    writeRaw(null);
    panelLoaded.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
    writeRaw(null);
  });

  it("renders nothing and loads no panel code while no tour is active", () => {
    const { container } = dock();
    expect(container).toBeEmptyDOMElement();
    expect(panelLoaded).not.toHaveBeenCalled();
  });

  it("loads the panel once a tour is active and shows the collapsed one-liner", async () => {
    stored(goTo(startTour(TENANT), 6));
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    expect(panelLoaded).toHaveBeenCalled();
    expect(region).toHaveTextContent(`Guided tour, step 7 of 16: ${TOUR_STEPS[6]!.title}`);
    expect(within(region).getByRole("button", { name: "Expand" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(within(region).getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(within(region).getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.queryByText("Control to try")).not.toBeInTheDocument();
  });

  it("moves between steps with Previous and Next, never blocked, and stores the position", async () => {
    stored();
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    expect(within(region).getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(within(region).getByRole("button", { name: "Next" }));
    await waitFor(() => expect(region).toHaveTextContent("step 2 of 16"));
    fireEvent.click(within(region).getByRole("button", { name: "Previous" }));
    await waitFor(() => expect(region).toHaveTextContent("step 1 of 16"));
    const raw = JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY) ?? "null");
    expect(raw.current).toBe(0);
  });

  it("offers Finish tour instead of Next on the last step and ends the tour", async () => {
    stored(goTo(startTour(TENANT), 15));
    const { container } = dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    expect(within(region).queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    fireEvent.click(within(region).getByRole("button", { name: "Finish tour" }));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
  });

  it("expands to the step list and the step card", async () => {
    stored(goTo(markDone(startTour(TENANT), "home"), 6));
    const { container } = dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    const step = TOUR_STEPS[6]!;
    expect(within(region).getByRole("button", { name: "Collapse" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(region).getByRole("heading", { name: new RegExp(step.title) })).toBeVisible();
    expect(within(region).getByText("Control to try")).toBeInTheDocument();
    expect(within(region).getByText(step.tryIt)).toBeInTheDocument();
    expect(within(region).getByText("Expected outcome")).toBeInTheDocument();
    expect(within(region).getByText(step.expected)).toBeInTheDocument();
    expect(within(region).getByText("Scientific approver", { selector: "dd" })).toBeInTheDocument();
    const list = within(region).getByRole("list", { name: "Tour steps" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(16);
    expect(within(list).getAllByRole("button", { current: "step" })).toHaveLength(1);
    expect(within(list).getAllByText("Done")).toHaveLength(1);
    const open = within(region).getByRole("link", { name: "Open W4" });
    expect(open).toHaveAttribute("href", "/demo/w4-gates");
    await expectNoAxeViolations(container);
  });

  it("jumps to a step from the list", async () => {
    stored();
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: /^13\. / }));
    await waitFor(() => expect(region).toHaveTextContent("step 13 of 16"));
  });

  it("marks a step done", async () => {
    stored();
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: "Mark step done" }));
    await waitFor(() => expect(within(region).getAllByText("Done")).toHaveLength(1));
    expect(JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY) ?? "null").done).toEqual([
      "home",
    ]);
  });

  it("uses a plain link for the homepage step and a client link inside the demo", async () => {
    stored();
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    const home = within(region).getByRole("link", { name: "Open homepage" });
    expect(home).toHaveAttribute("href", "/");
    expect(within(region).queryByRole("button", { name: /^Switch to/ })).not.toBeInTheDocument();
  });

  it("offers Switch to <persona> only when the session persona differs", async () => {
    stored(goTo(startTour(TENANT), 6));
    const { unmount } = dock("scientist");
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    expect(
      within(region).getByRole("button", { name: "Switch to Scientific approver" }),
    ).toBeInTheDocument();
    unmount();
    dock("scientific_approver");
    const again = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(again).getByRole("button", { name: "Expand" }));
    expect(within(again).queryByRole("button", { name: /^Switch to/ })).not.toBeInTheDocument();
  });

  it("switches persona through the BFF and refreshes the server tree", async () => {
    const fetchMock = vi.fn(async () => Response.json({ persona: "scientific_approver" }));
    vi.stubGlobal("fetch", fetchMock);
    stored(goTo(startTour(TENANT), 6));
    dock("scientist");
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: "Switch to Scientific approver" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/demo/sessions/persona");
    expect(init.body).toBe(JSON.stringify({ persona: "scientific_approver" }));
  });

  it("shows a retryable alert when the persona switch fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ code: "x", message: "y" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ persona: "scientific_approver" }));
    vi.stubGlobal("fetch", fetchMock);
    stored(goTo(startTour(TENANT), 6));
    dock("scientist");
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: "Switch to Scientific approver" }));
    expect(await within(region).findByRole("alert")).toHaveTextContent("Could not switch persona");
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.click(within(region).getByRole("button", { name: "Switch to Scientific approver" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(within(region).queryByRole("alert")).not.toBeInTheDocument());
  });

  it("Reset demo resets the tenant and returns progress to step one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ tenant_id: "t", counts: {} })),
    );
    stored(goTo(markDone(startTour(TENANT), "home"), 8));
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: "Reset demo" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reset" }));
    await waitFor(() => expect(region).toHaveTextContent("step 1 of 16"));
    expect(JSON.parse(window.sessionStorage.getItem(TOUR_STORAGE_KEY) ?? "null")).toMatchObject({
      current: 0,
      done: [],
    });
  });

  it("End tour removes the stored progress and the dock", async () => {
    stored();
    const { container } = dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    fireEvent.click(within(region).getByRole("button", { name: "End tour" }));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
  });

  it("shows a completion message once every step is done", async () => {
    const all = TOUR_STEPS.reduce((state, step) => markDone(state, step.id), startTour(TENANT));
    stored(goTo(all, 15));
    dock();
    const region = await screen.findByRole("complementary", { name: "Guided tour" });
    fireEvent.click(within(region).getByRole("button", { name: "Expand" }));
    expect(within(region).getByRole("status")).toHaveTextContent("Tour complete");
    await act(async () => {});
  });

  it("restarts with a notice when stored progress belongs to another demo session", async () => {
    writeRaw(serializeState(startTour("tenant-other")));
    dock();
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent(/different demo session/i);
    expect(screen.getByRole("link", { name: "Start the tour again" })).toHaveAttribute(
      "href",
      "/demo/tour",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(window.sessionStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
  });
});
