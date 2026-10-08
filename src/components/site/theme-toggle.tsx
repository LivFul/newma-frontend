"use client";

import * as RadixRadio from "radix-ui/radio-group";
import { cva } from "class-variance-authority";
import {
  THEME_DARK,
  THEME_GROUP_LABEL,
  THEME_LIGHT,
  THEME_SYSTEM,
} from "@/content/home/chrome";
import { cn } from "@/lib/cn";
import { useThemePreference } from "@/lib/theme/use-theme-preference";
import type { ThemePreference } from "@/lib/theme/state";

const segment = cva(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-sm transition-colors " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
    "text-fg-muted hover:bg-fg/[0.06] hover:text-fg " +
    "data-[state=checked]:bg-fg/10 data-[state=checked]:text-fg",
);

function ThemeIcon({ mode }: { mode: ThemePreference }) {
  const common = { width: 18, height: 18, "aria-hidden": true as const };
  if (mode === "light") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        />
      </svg>
    );
  }
  if (mode === "dark") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" d="M8 20h8" strokeLinecap="round" />
    </svg>
  );
}

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: "light", label: THEME_LIGHT.text },
  { value: "dark", label: THEME_DARK.text },
  { value: "system", label: THEME_SYSTEM.text },
];

type ThemeToggleProps = {
  className?: string;
};

/** Icon-only three-way theme control for the Liquid Glass header bar. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference } = useThemePreference();

  return (
    <RadixRadio.Root
      className={cn("glass-control inline-flex items-center gap-0.5 rounded-full p-0.5", className)}
      aria-label={THEME_GROUP_LABEL.text}
      value={preference}
      onValueChange={(value) => {
        if (value === "light" || value === "dark" || value === "system") setPreference(value);
      }}
    >
      {OPTIONS.map(({ value, label }) => (
        <RadixRadio.Item
          key={value}
          value={value}
          aria-label={label}
          className={segment()}
        >
          <ThemeIcon mode={value} />
          <span className="sr-only">{label}</span>
        </RadixRadio.Item>
      ))}
    </RadixRadio.Root>
  );
}
