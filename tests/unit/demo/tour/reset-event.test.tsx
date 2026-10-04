import { configure, fireEvent, getConfig, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ResetButton } from "@/app/(platform)/demo/_components/reset-button";
import { DEMO_RESET_EVENT } from "@/lib/demo/tour/reset-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

// Lazily imported dialogs and panels resolve after a dynamic import; under a full parallel run that
// can exceed Testing Library's default 1 s wait. A longer ceiling only slows a genuine failure, and
// it is scoped to this file so other suites keep the default.
const defaultAsyncTimeout = getConfig().asyncUtilTimeout;
beforeAll(() => configure({ asyncUtilTimeout: 5_000 }));
afterAll(() => configure({ asyncUtilTimeout: defaultAsyncTimeout }));

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

describe("reset dialog focus", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns focus to the Reset demo data button when the dialog is cancelled", async () => {
    render(<ResetButton />);
    const opener = screen.getByRole("button", { name: "Reset demo data" });
    fireEvent.click(opener);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});
