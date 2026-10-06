import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";
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
  it("applies the variant classes", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger");
  });
  it("exposes buttonVariants for non-button elements", () => {
    expect(buttonVariants({ variant: "danger" })).toContain("bg-danger");
    expect(buttonVariants()).toContain("bg-brand");
  });
  // Value: protects=filled variants keep border-transparent (forced-colors still draws an outline) while secondary draws an ink border; fails_when=a variant loses its border colour so no outline shows in forced colours; why_new=old negative assertion became vacuous when the base class dropped border-transparent; seam=none
  it("gives filled variants a transparent border and secondary an ink border", () => {
    for (const variant of ["primary", "danger", "ghost"] as const) {
      expect(buttonVariants({ variant }), variant).toContain("border-transparent");
    }
    const secondary = buttonVariants({ variant: "secondary" });
    expect(secondary).toContain("border-fg");
    expect(secondary).not.toContain("border-transparent");
  });
  it("sizes with min-height and padding and styles aria-disabled like disabled", () => {
    render(<Button aria-disabled="true">Pending</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-h-10", "aria-disabled:opacity-50", "disabled:opacity-50");
    expect(button.className.split(" ")).not.toContain("h-10");
  });
  it("is usable from server components (no client directive)", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../../../src/components/ui/button.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/^"use client";/m);
  });
});
