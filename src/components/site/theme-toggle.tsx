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
import { useTheme } from "@/lib/theme/use-theme";
import type { ThemePreference } from "@/lib/theme/state";

const segment = cva(
  "inline-flex min-h-11 items-center justify-center rounded-full transition-colors " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
    "text-fg-muted hover:bg-fg/[0.06] hover:text-fg " +
    "data-[state=checked]:bg-fg/10 data-[state=checked]:text-fg",
  {
    variants: {
      layout: {
        bar: "min-w-11 px-2.5 text-sm",
        sheet: "w-full flex-1 justify-start gap-2 px-2 -mx-2 text-base text-fg active:bg-fg/[0.1]",
      },
    },
    defaultVariants: { layout: "sheet" },
  },
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
  /** Compact icon row in the header bar (lg+), or full-width rows in the mobile sheet. */
  layout?: "bar" | "sheet";
};

export function ThemeToggle({ className, layout = "sheet" }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const isBar = layout === "bar";

  return (
    <RadixRadio.Root
      className={cn(
        isBar
          ? "glass-control inline-flex items-center gap-0.5 rounded-full p-0.5"
          : "flex flex-col gap-1",
        className,
      )}
      aria-label={THEME_GROUP_LABEL.text}
      value={preference}
      onValueChange={(value) => {
        if (value === "light" || value === "dark" || value === "system") setPreference(value);
      }}
    >
      {!isBar ? (
        <span className="font-mono px-2 pt-1 text-xs font-bold tracking-[0.14em] text-fg-muted uppercase">
          {THEME_GROUP_LABEL.text}
        </span>
      ) : null}
      <div className={cn(isBar ? "inline-flex gap-0.5" : "flex flex-col gap-1 px-2 pb-1")}>
        {OPTIONS.map(({ value, label }) => (
          <RadixRadio.Item
            key={value}
            value={value}
            aria-label={label}
            className={segment({ layout })}
          >
            <span className={cn("inline-flex shrink-0 items-center", isBar ? "" : "gap-2")}>
              <ThemeIcon mode={value} />
              <span className={isBar ? "sr-only" : undefined}>{label}</span>
            </span>
          </RadixRadio.Item>
        ))}
      </div>
    </RadixRadio.Root>
  );
}
