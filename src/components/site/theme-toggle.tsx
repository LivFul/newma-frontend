"use client";

import * as RadixRadio from "radix-ui/radio-group";
import { cva } from "class-variance-authority";
import { THEME_DARK, THEME_GROUP_LABEL, THEME_LIGHT, THEME_SYSTEM } from "@/content/home/chrome";
import { cn } from "@/lib/cn";
import { useThemePreference } from "@/lib/theme/use-theme-preference";
import type { ThemePreference } from "@/lib/theme/state";

const segment = cva(
  "inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
    "text-fg-muted hover:bg-fg/[0.06] hover:text-fg " +
    "data-[state=checked]:bg-fg/10 data-[state=checked]:text-fg",
);

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: "light", label: THEME_LIGHT.text },
  { value: "dark", label: THEME_DARK.text },
  { value: "system", label: THEME_SYSTEM.text },
];

type ThemeToggleProps = {
  className?: string;
};

/** Three-way theme control. Words, at a 44px target, because this lives in the menu sheet. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference } = useThemePreference();

  return (
    <RadixRadio.Root
      className={cn("inline-flex flex-wrap items-center gap-1", className)}
      aria-label={THEME_GROUP_LABEL.text}
      value={preference}
      onValueChange={(value) => {
        if (value === "light" || value === "dark" || value === "system") setPreference(value);
      }}
    >
      {OPTIONS.map(({ value, label }) => (
        <RadixRadio.Item key={value} value={value} className={segment()}>
          {label}
        </RadixRadio.Item>
      ))}
    </RadixRadio.Root>
  );
}
