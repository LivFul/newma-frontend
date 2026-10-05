import { configure, fireEvent, getConfig, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DEMO_BANNER_TEXT, DemoBanner } from "@/app/(platform)/demo/_components/demo-banner";
import { DemoHeader } from "@/app/(platform)/demo/_components/demo-header";
import { PersonaSwitcher } from "@/app/(platform)/demo/_components/persona-switcher";
import { ResetButton } from "@/app/(platform)/demo/_components/reset-button";
import { SignOutButton } from "@/app/(platform)/demo/_components/sign-out-button";
import { WorkflowRail } from "@/app/(platform)/demo/_components/workflow-rail";
import { PERSONAS } from "@/lib/personas";
import { expectNoAxeViolations } from "../ui/axe";

const refresh = vi.fn();
const push = vi.fn();
const nav = vi.hoisted(() => ({ pathname: "/demo/w4-gates/abc" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => nav.pathname,
}));

const session = {
  persona: "scientist" as const,
  tenant_id: "tenant-abc",
  expires_at: "2030-01-01T00:00:00.000Z",
  created_at: "2029-12-31T00:00:00.000Z",
};

// Lazily imported dialogs and panels resolve after a dynamic import; under a full parallel run that
// can exceed Testing Library's default 1 s wait. A longer ceiling only slows a genuine failure, and
// it is scoped to this file so other suites keep the default.
const defaultAsyncTimeout = getConfig().asyncUtilTimeout;
beforeAll(() => configure({ asyncUtilTimeout: 5_000 }));
afterAll(() => configure({ asyncUtilTimeout: defaultAsyncTimeout }));

describe("DemoBanner", () => {
  it("renders the verbatim notice as a labelled note with the Synthetic badge", async () => {
    const { container } = render(<DemoBanner />);
    expect(DEMO_BANNER_TEXT).toBe(
      "Demo with synthetic data. Not evidence of scientific performance, deployment or compliance (PRD front matter).",
    );
    const note = screen.getByRole("note", { name: "Demo notice" });
    expect(note).toHaveTextContent(DEMO_BANNER_TEXT);
    expect(screen.getByText("Synthetic")).toHaveClass("bg-warning");
    // axe "region": the note must sit inside a named landmark.
    expect(screen.getByRole("region", { name: "Demo banner" })).toContainElement(note);
    await expectNoAxeViolations(container);
  });
});

describe("DemoHeader", () => {
  it("shows the persona label, the Demo sign-in label and all eight persona options", async () => {
    const { container } = render(<DemoHeader session={session} />);
    expect(screen.getByTestId("current-persona")).toHaveTextContent("Scientist");
    expect(screen.getByText("Demo sign-in")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: /persona/i });
    expect(select).toHaveValue("scientist");
    expect(screen.getAllByRole("option")).toHaveLength(PERSONAS.length);
    expect(screen.getByRole("link", { name: /NEWMA/ })).toHaveAttribute("href", "/demo");
    await expectNoAxeViolations(container);
  });
});

describe("WorkflowRail", () => {
  it("links the dashboard, all ten workflows, jobs and the tour, and marks the current one", async () => {
    const { container } = render(<WorkflowRail />);
    expect(screen.getByRole("navigation", { name: "Demo sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /jobs/i })).toHaveAttribute("href", "/demo/jobs");
    expect(screen.getByRole("link", { name: /guided tour/i })).toHaveAttribute(
      "href",
      "/demo/tour",
    );
    expect(screen.getByRole("link", { name: /^W4/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("link", { name: /^W\d+/ })).toHaveLength(10);
    await expectNoAxeViolations(container);
  });
});

// Value: protects=rail marks exactly one current page (dashboard only on /demo, prefix on a segment boundary); fails_when=isActive matches loosely, so two links claim aria-current; why_new=redesign rewrote the rail and only /demo/w4-gates/abc was exercised; seam=none
describe("WorkflowRail current-page matching", () => {
  afterEach(() => {
    nav.pathname = "/demo/w4-gates/abc";
  });
  const current = (pathname: string): string[] => {
    nav.pathname = pathname;
    const { unmount } = render(<WorkflowRail />);
    const names = screen
      .queryAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.getAttribute("href") ?? "");
    unmount();
    return names;
  };

  it("marks the dashboard only on /demo itself", () => {
    expect(current("/demo")).toEqual(["/demo"]);
    expect(current("/demo/jobs")).toEqual(["/demo/jobs"]);
  });

  it("matches a workflow by path segment, not by shared prefix", () => {
    expect(current("/demo/w4-gates")).toEqual(["/demo/w4-gates"]);
    expect(current("/demo/w4-gates-extra")).toEqual([]);
    expect(current("/demo/tour/step")).toEqual(["/demo/tour"]);
  });
});

describe("PersonaSwitcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("posts the new persona to the BFF route and refreshes the server tree", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ...session, persona: "finance" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PersonaSwitcher persona="scientist" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "finance" } });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/demo/sessions/persona");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ persona: "finance" }));
  });

  it("surfaces a failure as an alert and keeps the previous persona", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "x", message: "nope" }, { status: 500 })),
    );
    render(<PersonaSwitcher persona="scientist" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "finance" } });
    await screen.findByRole("alert");
    expect(screen.getByRole("combobox")).toHaveValue("scientist");
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("SignOutButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("deletes the session through the BFF and navigates to /access", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/access"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/demo/sessions");
    expect(init.method).toBe("DELETE");
  });
});

describe("ResetButton lazy dialog (W10 weight, A-P5B-16)", () => {
  it("renders only the button until the first click and has no static dialog import", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/app/(platform)/demo/_components/reset-button.tsx", "utf8");
    expect(source).not.toMatch(/components\/ui\/dialog|from\s+["']@\/components\/ui["']/);
    render(<ResetButton />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("ResetButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("clears a previous error when the dialog is reopened and refreshes after a successful reset", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ code: "x", message: "y" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ tenant_id: "t", counts: {} }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ResetButton />);
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reset" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
