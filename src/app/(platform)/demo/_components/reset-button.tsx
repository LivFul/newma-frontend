"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui";

export function ResetButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const reset = () =>
    startTransition(async () => {
      const response = await fetch("/api/demo/reset", { method: "POST" }).catch(() => undefined);
      if (!response?.ok) {
        setError("Reset failed. Try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Reset demo data
        </Button>
      </DialogTrigger>
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
          <Button variant="danger" onClick={reset} disabled={pending}>
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
