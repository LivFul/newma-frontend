import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimulatedLabel } from "@/app/(platform)/demo/_components/simulated-label";
import { PersonaForbiddenNotice } from "@/app/(platform)/demo/_components/persona-forbidden-notice";
import { ErrorNotice } from "@/app/(platform)/demo/_components/error-notice";

describe("shared demo components", () => {
  it("renders a §3.1 label verbatim", () => {
    render(<SimulatedLabel label="Mock ELN" />);
    expect(screen.getByText("Mock ELN")).toBeInTheDocument();
  });

  it("names who may act when the persona is not allowed", () => {
    render(<PersonaForbiddenNotice allowed={["scientific_approver"]} />);
    expect(screen.getByRole("note")).toHaveTextContent(
      "Only Scientific approver can do this. Switch persona in the header.",
    );
  });

  it("renders a persona_forbidden envelope with the allowed personas", () => {
    render(
      <ErrorNotice
        error={{
          code: "persona_forbidden",
          message: "Persona not allowed.",
          details: { persona: "scientist", allowed: ["scientific_approver", "data_steward"] },
        }}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("persona_forbidden");
    expect(alert).toHaveTextContent("Allowed: Scientific approver, Data steward");
  });

  it("renders a plain error code and message and nothing when absent", () => {
    const { container, rerender } = render(<ErrorNotice error={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ErrorNotice error={{ code: "not_found", message: "Not found." }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Not found. (not_found)");
  });
});
