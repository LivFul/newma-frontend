import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./axe";

describe("Button", () => {
  it("renders an accessible button and fires onClick", async () => {
    const onClick = vi.fn();
    const { container } = render(<Button onClick={onClick}>Access NEWMA</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Access NEWMA" }));
    expect(onClick).toHaveBeenCalledOnce();
    await expectNoAxeViolations(container);
  });
  it("renders as a link with asChild", () => {
    render(
      <Button asChild>
        <a href="/access">Access</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Access" })).toHaveAttribute("href", "/access");
  });
  it("applies variant classes without mutating props", () => {
    const props = { variant: "danger" as const };
    render(<Button {...props}>Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger");
    expect(props).toEqual({ variant: "danger" });
  });
});
