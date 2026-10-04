import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeedControl } from "@/app/(platform)/demo/tour/_components/speed-control";
import { expectNoAxeViolations } from "../../ui/axe";

const config = (over: Record<string, unknown> = {}) => ({
  speed_factor: 4,
  server_speed_factor: 4,
  speed_source: "server_default",
  min_speed_factor: 1,
  max_speed_factor: 10,
  ...over,
});

type Call = [string, RequestInit | undefined];
const calls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls as unknown as Call[];

describe("SpeedControl (A-P5B-17)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the effective speed and its source through the BFF", async () => {
    const fetchMock = vi.fn(async () => Response.json(config()));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<SpeedControl />);
    expect(await screen.findByText("Demo speed: 4×")).toBeInTheDocument();
    expect(screen.getByText("(server default)")).toBeInTheDocument();
    expect(screen.getByText("Simulated workflow engine")).toBeInTheDocument();
    expect(calls(fetchMock)[0]![0]).toBe("/api/demo/config");
    expect(screen.getByRole("combobox", { name: "Set demo speed" })).toHaveValue("server");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "1×",
      "2×",
      "4×",
      "6×",
      "8×",
      "10×",
      "Server default",
    ]);
    expect(screen.getByText(/recommended speed/i)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("shows an override as such and selects it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(config({ speed_factor: 8, speed_source: "tenant_override" })),
      ),
    );
    render(<SpeedControl />);
    expect(await screen.findByText("Demo speed: 8×")).toBeInTheDocument();
    expect(screen.getByText("(your override)")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("8");
  });

  it("writes the chosen speed through the BFF and shows the response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(config()))
      .mockResolvedValueOnce(
        Response.json(config({ speed_factor: 8, speed_source: "tenant_override" })),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<SpeedControl />);
    await screen.findByText("Demo speed: 4×");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "8" } });
    expect(await screen.findByText("Demo speed: 8×")).toBeInTheDocument();
    const [url, init] = calls(fetchMock)[1]!;
    expect(url).toBe("/api/demo/config");
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(JSON.stringify({ speed_factor: 8 }));
  });

  it("clears the override with null for Server default", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(config({ speed_factor: 8, speed_source: "tenant_override" })),
      )
      .mockResolvedValueOnce(Response.json(config()));
    vi.stubGlobal("fetch", fetchMock);
    render(<SpeedControl />);
    await screen.findByText("Demo speed: 8×");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "server" } });
    expect(await screen.findByText("(server default)")).toBeInTheDocument();
    expect(calls(fetchMock)[1]![1]?.body).toBe(JSON.stringify({ speed_factor: null }));
  });

  it("rejects a value outside 1-10 on the client without calling the BFF", async () => {
    const fetchMock = vi.fn(async () => Response.json(config()));
    vi.stubGlobal("fetch", fetchMock);
    render(<SpeedControl />);
    await screen.findByText("Demo speed: 4×");
    for (const bad of ["0", "11"]) {
      fireEvent.change(screen.getByRole("combobox"), { target: { value: bad } });
      expect(await screen.findByRole("alert")).toHaveTextContent("from 1 to 10");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the server's 422 and keeps the shown speed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(config()))
      .mockResolvedValueOnce(
        Response.json(
          { code: "validation_error", message: "Speed is out of range." },
          { status: 422 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<SpeedControl />);
    await screen.findByText("Demo speed: 4×");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "6" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Speed is out of range.");
    expect(screen.getByText("Demo speed: 4×")).toBeInTheDocument();
  });

  it("offers a retry when the speed cannot be read", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ code: "upstream_error", message: "down" }, { status: 502 }),
      )
      .mockResolvedValueOnce(Response.json(config()));
    vi.stubGlobal("fetch", fetchMock);
    render(<SpeedControl />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not read the demo speed");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("Demo speed: 4×")).toBeInTheDocument());
  });
});
