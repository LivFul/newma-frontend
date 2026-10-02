"use client";
import { Dialog as RadixDialog } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

type RadixContentProps = ComponentPropsWithoutRef<typeof RadixDialog.Content>;

export type DialogContentProps = Omit<RadixContentProps, "title"> & {
  /** Always rendered as the accessible name (Radix Title). */
  title: string;
  /** Optional accessible description; when absent no aria-describedby is set. */
  description?: string;
  children?: ReactNode;
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DialogContent({
  title,
  description,
  children,
  className,
  ...props
}: DialogContentProps) {
  // Radix defaults aria-describedby to its Description id; clear it explicitly when there is none.
  const describedBy = description ? {} : { "aria-describedby": undefined };
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <RadixDialog.Content
        {...describedBy}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto",
          "-translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-bg-elevated p-6",
          "text-fg shadow-xl focus:outline-none",
          className,
        )}
        {...props}
      >
        <RadixDialog.Title className="pr-10 text-xl font-semibold">{title}</RadixDialog.Title>
        {description ? (
          <RadixDialog.Description className="mt-1 text-fg-muted">
            {description}
          </RadixDialog.Description>
        ) : null}
        <RadixDialog.Close
          aria-label="Close"
          className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-fg-muted hover:bg-border hover:text-fg"
        >
          <CloseIcon />
        </RadixDialog.Close>
        <div className="mt-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
