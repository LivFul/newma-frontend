"use client";
import { useState } from "react";
import { Button } from "@/components/ui";

const PREVIEW_LENGTH = 12;

type Props = Readonly<{ value: string; label: string }>;

/** A long hash or signature, shown truncated, with a copy control (the full value is copied). */
export function CopyHash({ value, label }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard) return setCopied(false);
    clipboard
      .writeText(value)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <code className="font-mono text-xs">{value.slice(0, PREVIEW_LENGTH)}…</code>
      <Button size="sm" variant="secondary" aria-label={`Copy ${label}`} onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </span>
  );
}
