// No "use client": Slot from radix-ui carries its own directive, so buttonVariants is
// callable from server components and Button renders in either tree.
import * as Slot from "radix-ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  // Filled variants carry border-transparent so forced-colors mode still draws an outline; the global
  // :focus-visible rule provides the focus ring.
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium " +
    "transition-[color,background-color,border-color,transform] disabled:opacity-50 disabled:pointer-events-none " +
    "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-accent text-accent-fg hover:bg-fg active:translate-y-px",
        secondary:
          "bg-transparent text-fg border-fg hover:bg-fg hover:text-bg active:translate-y-px",
        ghost: "border-transparent text-fg underline-offset-4 hover:bg-bg-deep hover:underline",
        danger: "border-transparent bg-danger text-danger-fg hover:bg-fg active:translate-y-px",
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
