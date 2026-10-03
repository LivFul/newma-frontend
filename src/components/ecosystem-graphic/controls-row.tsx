import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { HERO_HINT, HERO_TOGGLE_LABEL } from "@/content/home/hero-help";
import { cn } from "@/lib/cn";

// Shared by both layers: the same hint on the left and a toggle-sized slot on the right, so the row
// wraps identically before and after the swap and the content below never moves.
export const TOGGLE_CLASS = "min-h-11 min-w-11 shrink-0";

export function ControlsRow({ children }: { children: ReactNode }) {
  return (
    <div className="eco-controls mx-auto flex min-h-11 max-w-[34rem] items-center justify-between gap-3">
      <p className="text-sm text-fg-muted">{HERO_HINT.text}</p>
      {children}
    </div>
  );
}

// Static layer: an invisible, aria-hidden twin of the toggle that reserves exactly its space.
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
