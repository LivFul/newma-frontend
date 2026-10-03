"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// The dialog (Radix focus scope, portal, dismissable layer) is ~9 KB gzip: it loads on the first
// click, so a page's first load does not pay for a control most visitors never open (A-P5B-16).
const ResetDialog = dynamic(() => import("./reset-dialog"), { ssr: false });

/** `label` lets the tour dock offer the same dialog under its own name. */
export function ResetButton({ label = "Reset demo data" }: Readonly<{ label?: string }>) {
  // Each opening is a new session of the dialog, so an earlier error never shows again.
  const [sessions, setSessions] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setSessions((n) => n + 1);
          setOpen(true);
        }}
      >
        {label}
      </Button>
      {sessions > 0 ? <ResetDialog key={sessions} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
