"use client";
import * as RadixTooltip from "radix-ui/tooltip";
import type { ReactNode } from "react";

const TOOLTIP_SIDE_OFFSET = 6;

/**
 * App-level tooltip context. Mounted by `src/app/primitives/layout.tsx`, the only route that uses a
 * Tooltip; Radix exposes no way to detect a missing provider, so every `Tooltip` must sit
 * under it — tests wrap their render in `<TooltipProvider>`.
 */
export const TooltipProvider = RadixTooltip.Provider;

export type TooltipProps = {
  /** Short hint only. Tooltips never carry essential information: put that in visible text
   *  or a `VisuallyHidden` element, because touch users and some AT never see a tooltip. */
  content: string;
  /** Must be a single focusable control (e.g. `Button`) so keyboard users can open it. */
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={TOOLTIP_SIDE_OFFSET}
          className="z-50 max-w-xs rounded-md bg-fg px-2 py-1 text-xs text-bg shadow-md"
        >
          {content}
          <RadixTooltip.Arrow className="fill-fg" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
