import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LicenseRequestForm } from "@/app/(platform)/demo/w7-settlement/_components/license-request-form";
import { UUID, license, options } from "./fixtures";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

const bodies = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));

describe("LicenseRequestForm", () => {
  it("lists the latest agreement only, with illustrative basis-point shares and the reserve", () => {
    const { container } = render(<LicenseRequestForm options={options()} allowed />);
    const agreementSelect = screen.getByLabelText("Agreement");
    expect(agreementSelect.querySelectorAll("option")).toHaveLength(1);
    const rules = screen.getByTestId("agreement-rules");
    expect(rules).toHaveTextContent("Community Cooperative A, fictional");
    expect(rules).toHaveTextContent("2,500 basis points");
    expect(rules).toHaveTextContent("Reserve");
    expect(rules).toHaveTextContent("6,000 basis points");
    expect(screen.getAllByTestId("illustrative-badge").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("%");
    expect(screen.getByText(/Credential check is optional and simulated/)).toBeInTheDocument();
  });

  it("is not submittable for a persona outside partner", async () => {
    render(<LicenseRequestForm options={options()} allowed={false} />);
    const button = screen.getByRole("button", { name: "Request license" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.setup().click(button);
    expect(push).not.toHaveBeenCalled();
  });

  it("reuses one idempotency key across submits and navigates to the license on success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { code: "validation_error", message: "Too short.", details: [] },
          { status: 422 },
        ),
      )
      .mockResolvedValueOnce(Response.json(license(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LicenseRequestForm options={options()} allowed />);
    await user.selectOptions(
      screen.getByLabelText("Credential (optional, simulated)"),
      "DEMO-CRED-VALID-001",
    );
    await user.type(screen.getByLabelText("Scope"), "Illustrative research scope");
    await user.click(screen.getByRole("button", { name: "Request license" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("validation_error");
    await user.click(screen.getByRole("button", { name: "Request license" }));
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/demo/w7-settlement/licenses/${UUID(10)}`),
    );
    const [first, second] = bodies(fetchMock);
    expect(first.idempotency_key).toBeTruthy();
    expect(second.idempotency_key).toBe(first.idempotency_key);
    expect(first).toMatchObject({
      agreement_id: UUID(1),
      licensee_organization_id: UUID(3),
      purpose: "research",
      term_months: 12,
      credential_ref: "DEMO-CRED-VALID-001",
    });
  });

  it("omits the credential when none is chosen", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(license(), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LicenseRequestForm options={options()} allowed />);
    await user.type(screen.getByLabelText("Scope"), "Illustrative research scope");
    await user.click(screen.getByRole("button", { name: "Request license" }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(bodies(fetchMock)[0]).not.toHaveProperty("credential_ref");
  });

  it("renders agreement_superseded with the latest agreement id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: "agreement_superseded",
            message: "Superseded.",
            details: { latest_agreement_id: "agr-latest" },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<LicenseRequestForm options={options()} allowed />);
    await user.type(screen.getByLabelText("Scope"), "Illustrative research scope");
    await user.click(screen.getByRole("button", { name: "Request license" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("agreement_superseded");
    expect(alert).toHaveTextContent("agr-latest");
    expect(push).not.toHaveBeenCalled();
  });
});
