"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";

type Props = Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>;

/** The reset confirmation. Loaded on first use (see reset-button.tsx) to keep first loads light. */
export default function ResetDialog({ open, onOpenChange }: Props) {
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
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Reset this tenant?"
        description="Synthetic records for your demo tenant return to the seed. Other sessions are unaffected."
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
