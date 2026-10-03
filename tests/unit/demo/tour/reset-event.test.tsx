import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetButton } from "@/app/(platform)/demo/_components/reset-button";
import { DEMO_RESET_EVENT } from "@/lib/demo/tour/reset-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

describe("reset dialog and the tour", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("announces a successful reset on window so the tour can return to step one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ tenant_id: "t", counts: {} })),
    );
    const heard = vi.fn();
    window.addEventListener(DEMO_RESET_EVENT, heard);
    render(<ResetButton />);
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reset" }));
    await waitFor(() => expect(heard).toHaveBeenCalledTimes(1));
    window.removeEventListener(DEMO_RESET_EVENT, heard);
  });

  it("does not announce a failed reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "x", message: "y" }, { status: 500 })),
    );
    const heard = vi.fn();
    window.addEventListener(DEMO_RESET_EVENT, heard);
    render(<ResetButton />);
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reset" }));
    await screen.findByRole("alert");
    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener(DEMO_RESET_EVENT, heard);
  });
});
