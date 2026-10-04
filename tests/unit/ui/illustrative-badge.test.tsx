import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IllustrativeBadge } from "@/components/ui";
import { expectNoAxeViolations } from "./axe";

describe("IllustrativeBadge", () => {
  it("renders the verbatim label (prompt §3.1) and is axe-clean", async () => {
    const { container } = render(<IllustrativeBadge />);
    expect(screen.getByTestId("illustrative-badge")).toHaveTextContent("Illustrative");
    await expectNoAxeViolations(container);
  });
});
