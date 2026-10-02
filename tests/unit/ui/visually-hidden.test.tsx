import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { expectNoAxeViolations } from "./axe";

describe("VisuallyHidden", () => {
  it("keeps the text in the DOM for assistive tech with no axe violations", async () => {
    const { container } = render(<VisuallyHidden>End of gallery</VisuallyHidden>);
    expect(screen.getByText("End of gallery")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
