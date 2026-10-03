import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

const TOOLTIP_DELAY_MS = 200;

/** The tooltip context lives where a Tooltip is used, so other routes do not ship it. */
export default function PrimitivesLayout({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>{children}</TooltipProvider>;
}
