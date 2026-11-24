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
        // The one prominent action per view: white on the Lavender gradient (brand guide v1).
        primary:
          "glass-prominent btn-lift border-transparent bg-brand font-semibold text-prominent-fg hover:brightness-110 forced-colors:border-[ButtonText] forced-colors:bg-none",
        // Supporting pill: Forest ink on Sage (the guide's "Explore the Platform | How it works" pair).
        sage: "btn-lift border-transparent bg-sage font-semibold text-sage-fg hover:bg-sage-soft forced-colors:border-[ButtonText]",
        "sage-soft":
          "btn-lift border-transparent bg-sage-soft font-semibold text-sage-fg hover:bg-sage forced-colors:border-[ButtonText]",
        // Glass control: translucent with the glass rim, no blur layer (only the header blurs); firms up
        // on hover, never below what reduce-transparency or increased contrast require.
        secondary:
          "glass-control btn-lift text-fg hover:[--glass-control-tint:var(--glass-hover-tint)] forced-colors:border-[ButtonText]",
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
