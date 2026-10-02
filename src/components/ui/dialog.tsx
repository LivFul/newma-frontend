"use client";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export type DialogContentProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function DialogContent({ title, description, children, className }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/60" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg",
          "bg-bg-elevated p-6 text-fg shadow-xl border border-border",
          className,
        )}
      >
        <RadixDialog.Title className="text-xl font-semibold">{title}</RadixDialog.Title>
        {description ? (
          <RadixDialog.Description className="mt-1 text-fg-muted">
            {description}
          </RadixDialog.Description>
        ) : (
          <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
        )}
        <div className="mt-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
