import * as Slot from "radix-ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "btn-spring inline-flex items-center justify-center gap-2 rounded-full border font-medium " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "btn-lift border-transparent bg-brand text-accent-fg shadow-glow hover:brightness-110 forced-colors:border-[ButtonText] forced-colors:bg-none",
        secondary: "btn-lift bg-transparent text-fg border-fg/40 hover:bg-fg hover:text-bg",
        ghost: "border-transparent text-fg underline-offset-4 hover:bg-bg-deep/80 hover:underline",
        danger: "border-transparent bg-danger text-danger-fg hover:bg-fg",
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
