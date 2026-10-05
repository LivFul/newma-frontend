import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { expectNoAxeViolations } from "./axe";

describe("Badge", () => {
  it("renders the tone class and text with no axe violations", async () => {
    const { container } = render(<Badge tone="warning">Synthetic</Badge>);
    const badge = screen.getByText("Synthetic");
    expect(badge).toHaveClass("bg-warning", "border", "min-h-6");
    await expectNoAxeViolations(container);
  });
  it("defaults to the neutral tone with a visible border", () => {
    render(<Badge>Neutral</Badge>);
    const badge = screen.getByText("Neutral");
    expect(badge).toHaveClass("bg-bg-elevated", "border-border-strong");
  });

  // Value: protects=each tone draws a stroke ink border (warning-ink, success-ink) so the stamp holds 3:1 on paper; fails_when=a tone loses its ink border; why_new=tone borders were unasserted; seam=none
  it.each([
    ["warning", "border-warning-ink"],
    ["success", "border-success-ink"],
    ["danger", "border-danger"],
    ["accent", "border-accent"],
  ] as const)("draws the %s tone with %s", (tone, border) => {
    render(<Badge tone={tone}>Tone</Badge>);
    expect(screen.getByText("Tone")).toHaveClass(border);
  });
});

describe("StatusBadge", () => {
  it.each([
    ["PASS", "bg-success"],
    ["HOLD", "bg-warning"],
    ["PENDING", "bg-warning"],
    ["FAIL", "bg-danger"],
    ["INVALIDATED", "bg-danger"],
    ["NOT_STARTED", "bg-bg-elevated"],
  ] as const)("maps %s to the %s tone", (status, toneClass) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(container.firstElementChild).toHaveClass(toneClass);
  });
  it("prefixes the status with hidden context for assistive tech", async () => {
    const { container } = render(<StatusBadge status="PASS" />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toHaveTextContent("Status: PASS");
    expect(screen.getByText("Status:")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
