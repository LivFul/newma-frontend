"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// The dialog (Radix focus scope, portal, dismissable layer) is ~9 KB gzip: it loads on the first
// click, so a page's first load does not pay for a control most visitors never open (A-P5B-16).
const ResetDialog = dynamic(() => import("./reset-dialog"), { ssr: false });

export function ResetButton() {
  // Each opening is a new session of the dialog, so an earlier error never shows again.
  const [sessions, setSessions] = useState(0);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        size="sm"
        onClick={() => {
          setSessions((n) => n + 1);
          setOpen(true);
        }}
      >
        Reset demo data
      </Button>
      {sessions > 0 ? (
        <ResetDialog key={sessions} open={open} onOpenChange={setOpen} returnFocusTo={buttonRef} />
      ) : null}
    </>
  );
}
