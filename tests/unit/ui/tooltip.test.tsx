import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { expectNoAxeViolations } from "./axe";

describe("Tooltip", () => {
  it("shows the content on hover with no axe violations", async () => {
    render(
      <Tooltip content="Synthetic value">
        <Button variant="ghost">Hover me</Button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button", { name: "Hover me" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Synthetic value");
    await expectNoAxeViolations(document.body);
  });
});
