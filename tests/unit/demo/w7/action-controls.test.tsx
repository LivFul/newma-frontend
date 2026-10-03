import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionButton } from "@/app/(platform)/demo/w7-settlement/_components/action-button";
import { ActionDialog } from "@/app/(platform)/demo/w7-settlement/_components/action-dialog";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const keyOf = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body)).idempotency_key;

const refusal = () =>
  Response.json(
    {
      code: "settlement_state_conflict",
      message: "Nope.",
      details: { state: "disputed", attempted: "review" },
    },
    { status: 409 },
  );

describe("ActionButton", () => {
  it("posts the body with a key, refreshes on success and never double-posts while busy", async () => {
    let release: (r: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ActionButton label="Mark reviewed" endpoint="/api/demo/settlements/s1/review" />);
    const button = screen.getByRole("button", { name: "Mark reviewed" });
    await user.dblClick(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    release(Response.json({ id: "s1" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("retries with the same key after a refusal and renders the conflict detail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(refusal())
      .mockResolvedValueOnce(Response.json({ id: "s1" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ActionButton label="Mark reviewed" endpoint="/e" body={{ extra: 1 }} />);
    await user.click(screen.getByRole("button", { name: "Mark reviewed" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("settlement_state_conflict");
    expect(alert).toHaveTextContent("Settlement is disputed; attempted review.");
    await user.click(screen.getByRole("button", { name: "Mark reviewed" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(keyOf(fetchMock, 1)).toBe(keyOf(fetchMock, 0));
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)).extra).toBe(1);
  });

  it("is disabled with a visible reason", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ActionButton
        label="Reconcile"
        endpoint="/e"
        disabledReason="Resolve the disputed receipt first."
      />,
    );
    const button = screen.getByRole("button", { name: "Reconcile" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Resolve the disputed receipt first.")).toBeInTheDocument();
    await userEvent.setup().click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hands the response to onDone instead of refreshing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "s9" })));
    const onDone = vi.fn();
    render(<ActionButton label="Go" endpoint="/e" onDone={onDone} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ id: "s9" }));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("ActionDialog", () => {
  const dialog = (extra: Record<string, unknown> = {}) => (
    <ActionDialog
      trigger="Approve distribution"
      title="Approve distribution"
      submitLabel="Confirm approval"
      endpoint="/api/demo/settlements/s1/approvals"
      initial={{ rationale: "" }}
      fields={(draft, set) => (
        <label>
          Rationale
          <input value={draft.rationale} onChange={(e) => set({ rationale: e.target.value })} />
        </label>
      )}
      toBody={(draft, key) => ({ rationale: draft.rationale, idempotency_key: key })}
      {...extra}
    />
  );

  it("reuses the key generated on open for every submit (double submit replays)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(refusal())
      .mockResolvedValueOnce(
        Response.json({ ok: true }, { headers: { "Idempotent-Replayed": "true" } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(dialog());
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    await user.type(screen.getByLabelText("Rationale"), "Checked");
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("settlement_state_conflict");
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(keyOf(fetchMock, 1)).toBe(keyOf(fetchMock, 0));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is aria-busy while in flight and posts once for a double click", async () => {
    let release: (r: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(dialog());
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    const confirm = screen.getByRole("button", { name: "Confirm approval" });
    await user.dblClick(confirm);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveAttribute("aria-busy", "true");
    release(Response.json({}));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("mints a fresh key on each open", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => refusal());
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(dialog());
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Approve distribution" }));
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(keyOf(fetchMock, 1)).not.toBe(keyOf(fetchMock, 0));
  });

  it("is disabled with a visible reason", () => {
    render(dialog({ disabledReason: "Finance has already approved this calculation." }));
    expect(screen.getByRole("button", { name: "Approve distribution" })).toBeDisabled();
    expect(screen.getByText("Finance has already approved this calculation.")).toBeInTheDocument();
  });
});
