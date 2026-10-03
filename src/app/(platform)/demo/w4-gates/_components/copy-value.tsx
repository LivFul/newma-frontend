"use client";
import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Button size="sm" variant="ghost" onClick={copy} aria-label={label}>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
