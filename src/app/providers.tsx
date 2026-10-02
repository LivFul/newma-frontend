"use client";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

const TOOLTIP_DELAY_MS = 200;

/** Client-side contexts shared by every route; keep this list short (prompt §3.6 hero budget). */
export function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>{children}</TooltipProvider>;
}
