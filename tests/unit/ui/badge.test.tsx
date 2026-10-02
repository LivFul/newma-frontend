import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { expectNoAxeViolations } from "./axe";

describe("Badge", () => {
  it("renders the tone class and text with no axe violations", async () => {
    const { container } = render(<Badge tone="warning">Synthetic</Badge>);
    const badge = screen.getByText("Synthetic");
    expect(badge).toHaveClass("bg-warning");
    await expectNoAxeViolations(container);
  });
  it("defaults to the neutral tone", () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText("Neutral")).toHaveClass("bg-bg-elevated");
  });
});
