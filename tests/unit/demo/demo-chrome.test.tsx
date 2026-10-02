import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_BANNER_TEXT, DemoBanner } from "@/app/(platform)/demo/_components/demo-banner";
import { DemoHeader } from "@/app/(platform)/demo/_components/demo-header";
import { PersonaSwitcher } from "@/app/(platform)/demo/_components/persona-switcher";
import { SignOutButton } from "@/app/(platform)/demo/_components/sign-out-button";
import { PERSONAS } from "@/lib/personas";
import { expectNoAxeViolations } from "../ui/axe";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));

const session = {
  persona: "scientist" as const,
  tenant_id: "tenant-abc",
  expires_at: "2030-01-01T00:00:00.000Z",
  created_at: "2029-12-31T00:00:00.000Z",
};

describe("DemoBanner", () => {
  it("renders the verbatim notice as a labelled note with the Synthetic badge", async () => {
    const { container } = render(<DemoBanner />);
    expect(DEMO_BANNER_TEXT).toBe(
      "Demo with synthetic data. Not evidence of scientific performance, deployment or compliance (PRD front matter).",
    );
    const note = screen.getByRole("note", { name: "Demo notice" });
    expect(note).toHaveTextContent(DEMO_BANNER_TEXT);
    expect(screen.getByText("Synthetic")).toHaveClass("bg-warning");
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
    expect(screen.getByRole("link", { name: /jobs/i })).toHaveAttribute("href", "/demo/jobs");
    await expectNoAxeViolations(container);
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
