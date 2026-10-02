"use client";
import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

const TOOLTIP_DELAY_MS = 200;
const TOOLTIP_SIDE_OFFSET = 6;

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={TOOLTIP_DELAY_MS}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            sideOffset={TOOLTIP_SIDE_OFFSET}
            className="rounded-sm bg-fg px-2 py-1 text-xs text-bg"
          >
            {content}
            <RadixTooltip.Arrow className="fill-fg" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
