import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  type DialogContentProps,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./axe";

const renderDialog = (overrides: Partial<DialogContentProps> = {}) =>
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent title="Confirm decision" description="Step-up confirmation" {...overrides}>
        <Button>Sign</Button>
      </DialogContent>
    </Dialog>,
  );

const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  return screen.findByRole("dialog", { name: "Confirm decision" });
};

describe("Dialog", () => {
  it("opens with a labelled dialog role and closes on Escape", async () => {
    renderDialog();
    const dialog = await open();
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
    await expectNoAxeViolations(document.body);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("omits aria-describedby when no description is given", async () => {
    renderDialog({ description: undefined });
    const dialog = await open();
    expect(dialog).not.toHaveAttribute("aria-describedby");
    await expectNoAxeViolations(document.body);
  });

  it("closes from the built-in Close button and returns focus to the trigger", async () => {
    renderDialog();
    await open();
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveClass("min-h-11", "min-w-11");
    await userEvent.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("wraps Tab from the last control back to the first", async () => {
    renderDialog();
    await open();
    const close = screen.getByRole("button", { name: "Close" });
    const sign = screen.getByRole("button", { name: "Sign" });
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(sign).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
  });

  it("forwards Radix Content props such as onOpenAutoFocus", async () => {
    const onOpenAutoFocus = vi.fn((event: Event) => event.preventDefault());
    renderDialog({ onOpenAutoFocus });
    await open();
    expect(onOpenAutoFocus).toHaveBeenCalledOnce();
  });

  it("layers above page content and scrolls long content", async () => {
    renderDialog();
    const dialog = await open();
    expect(dialog).toHaveClass("z-50", "overflow-y-auto", "focus:outline-none");
  });
});
