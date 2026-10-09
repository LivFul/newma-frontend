import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { HERO_CAPTION, HERO_MAP_LEGEND } from "@/content/home/hero-caption";
import { HERO_HINT, HERO_TOGGLE_LABEL } from "@/content/home/hero-help";
import { cn } from "@/lib/cn";

export const TOGGLE_CLASS = "min-h-11 min-w-11 text-center";

/** Copy and toggle sit below the diagram in one figcaption so the stack reads top to bottom. */
export function HeroDiagramFooter({ toggle }: { toggle: ReactNode }) {
  return (
    <figcaption className="mx-auto max-w-[34rem] space-y-2 pb-2 text-sm text-fg-muted">
      <p>{HERO_HINT.text}</p>
      <p>{HERO_CAPTION.text}</p>
      <p className="text-xs">{HERO_MAP_LEGEND.text}</p>
      <div className="eco-controls flex min-h-11 items-center justify-end pt-1">{toggle}</div>
    </figcaption>
  );
}

export function TogglePlaceholder() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        TOGGLE_CLASS,
        "invisible",
      )}
    >
      {HERO_TOGGLE_LABEL.text}
    </span>
  );
}
