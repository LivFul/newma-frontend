import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { VisuallyHidden } from "./visually-hidden";

export const badgeVariants = cva(
  // border-transparent keeps the chip outlined in forced-colors mode.
  "inline-flex min-h-6 items-center rounded-sm border border-transparent px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-bg-elevated text-fg border-border",
        accent: "bg-accent text-accent-fg",
        warning: "bg-warning text-warning-fg",
        danger: "bg-danger text-danger-fg",
        success: "bg-success text-success-fg",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// GateStatus (P3 contract; PRD §3.3 / RM §2.6): NOT_STARTED PENDING PASS FAIL HOLD INVALIDATED.
// A-P0-F13 resolved: the badge vocabulary is exactly the gate status enum.
const STATUS_TONE = {
  PASS: "success",
  HOLD: "warning",
  PENDING: "warning",
  FAIL: "danger",
  INVALIDATED: "danger",
  NOT_STARTED: "neutral",
} as const satisfies Record<string, NonNullable<BadgeProps["tone"]>>;

export type Status = keyof typeof STATUS_TONE;

export type StatusBadgeProps = Omit<BadgeProps, "tone" | "children"> & { status: Status };

/** A Badge whose colour alone never carries the meaning: screen readers hear "Status: PASS". */
export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  return (
    <Badge tone={STATUS_TONE[status]} {...props}>
      <VisuallyHidden>Status: </VisuallyHidden>
      {status}
    </Badge>
  );
}
