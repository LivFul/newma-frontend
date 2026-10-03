"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { DEMO_RESET_EVENT } from "@/lib/demo/tour/reset-event";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opened the dialog: focus returns to it on close (the dialog has no trigger). */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}>;

/** The reset confirmation. Loaded on first use (see reset-button.tsx) to keep first loads light. */
export default function ResetDialog({ open, onOpenChange, returnFocusTo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const reset = () => {
    if (pending) return;
    startTransition(async () => {
      const response = await fetch("/api/demo/reset", { method: "POST" }).catch(() => undefined);
      if (!response?.ok) {
        setError("Reset failed. Try again.");
        return;
      }
      window.dispatchEvent(new Event(DEMO_RESET_EVENT));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo?.current?.focus();
        }}
        title="Reset demo data?"
        description="Synthetic records for your demo tenant return to the seed, and an active guided tour returns to step 1. Other sessions are unaffected."
      >
        {error ? (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="danger" onClick={reset} aria-busy={pending || undefined}>
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
