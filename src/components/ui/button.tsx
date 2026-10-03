// No "use client": Slot from radix-ui carries its own directive, so buttonVariants is
// callable from server components and Button renders in either tree.
import * as Slot from "radix-ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  // border-transparent keeps a visible outline in forced-colors mode; the global
  // :focus-visible rule provides the focus ring.
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-medium " +
    "transition-colors disabled:opacity-50 disabled:pointer-events-none " +
    "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:opacity-90",
        secondary: "bg-bg-elevated text-fg border-border-strong hover:bg-border",
        ghost: "text-fg hover:bg-bg-elevated",
        danger: "bg-danger text-danger-fg hover:opacity-90",
      },
      size: {
        sm: "min-h-8 px-3 py-1 text-sm",
        md: "min-h-10 px-4 py-2 text-base",
        lg: "min-h-12 px-6 py-3 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type = "button", ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
