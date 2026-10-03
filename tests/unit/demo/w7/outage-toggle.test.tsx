import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutageToggle } from "@/app/(platform)/demo/w7-settlement/_components/outage-toggle";

afterEach(() => vi.unstubAllGlobals());

const outage = (active: boolean) => ({
  active,
  label: "Optional, simulated" as const,
  updated_at: null,
});

describe("OutageToggle (A-P5A-F06)", () => {
  it("is a labelled switch carrying the Optional, simulated badge", () => {
    render(<OutageToggle initial={outage(false)} />);
    const toggle = screen.getByRole("switch", { name: "Simulate chain outage (demo)" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Optional, simulated")).toBeInTheDocument();
  });

  it("sends {active: true} and reflects the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(outage(true)));
    vi.stubGlobal("fetch", fetchMock);
    render(<OutageToggle initial={outage(false)} />);
    await userEvent.setup().click(screen.getByRole("switch"));
    await vi.waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true"),
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/demo/anchoring/outage");
    expect((init as RequestInit).method).toBe("PUT");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ active: true });
    const status = screen.getByTestId("outage-status");
    expect(status).toHaveTextContent("Chain outage simulated — new anchors stay pending");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("keeps the previous state and shows the error when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ code: "validation_error", message: "Bad." }, { status: 422 }),
        ),
    );
    render(<OutageToggle initial={outage(false)} />);
    await userEvent.setup().click(screen.getByRole("switch"));
    expect(await screen.findByRole("alert")).toHaveTextContent("validation_error");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("says nothing is affected when the outage is off", () => {
    render(<OutageToggle initial={outage(false)} />);
    expect(screen.getByTestId("outage-status")).toHaveTextContent("Anchoring works normally");
  });
});
