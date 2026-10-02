import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { expectNoAxeViolations } from "./axe";

const renderTooltip = () =>
  render(
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Synthetic value">
        <Button variant="ghost">Hover me</Button>
      </Tooltip>
    </TooltipProvider>,
  );

describe("Tooltip", () => {
  it("shows the content on hover with no axe violations", async () => {
    renderTooltip();
    await userEvent.hover(screen.getByRole("button", { name: "Hover me" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Synthetic value");
    expect(tooltip).toHaveClass("max-w-xs");
    await expectNoAxeViolations(document.body);
  });

  it("opens on keyboard focus, describes the trigger, and closes on Escape", async () => {
    renderTooltip();
    await userEvent.tab();
    const trigger = screen.getByRole("button", { name: "Hover me" });
    expect(trigger).toHaveFocus();
    const tooltip = await screen.findByRole("tooltip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });
});
