import type { EdgeTone, LaneId } from "@/lib/workflow/graph";

// The WebGL scene cannot read CSS variables, so these hex values mirror the site tokens in
// src/styles/tokens/color.css and ecosystem.css. tests/unit/workflow/palette.test.ts fails when they
// drift, so a token change cannot leave the scene in the old colours.
export const SCENE_COLORS = Object.freeze({
  /** --color-bg-elevated: the panel the static diagram sits on, so the swap is seamless. */
  background: 0x141a2e,
  /** --color-bg */
  ink: 0x0b1020,
  /** --color-fg */
  text: 0xf3f5f9,
  /** --color-fg-muted */
  textMuted: 0xb7bfd1,
  /** --color-accent */
  accent: 0x7cc4ff,
  /** --color-border */
  border: 0x2a334d,
  /** --color-warning */
  warning: 0xffd27a,
  /** --color-success */
  success: 0x8fe3b4,
  /** --color-danger */
  danger: 0xff8f8f,
  /** --color-eco-compute */
  compute: 0xb69cff,
});

export const LANE_COLORS: Readonly<Record<LaneId, number>> = Object.freeze({
  governance: SCENE_COLORS.warning,
  execution: SCENE_COLORS.success,
  learning: SCENE_COLORS.compute,
  confirmation: SCENE_COLORS.accent,
  outcome: SCENE_COLORS.textMuted,
});

export const TONE_COLORS: Readonly<Record<EdgeTone, number>> = Object.freeze({
  pass: SCENE_COLORS.accent,
  remediate: SCENE_COLORS.warning,
  fail: SCENE_COLORS.danger,
  learn: SCENE_COLORS.compute,
});

export const cssHex = (hex: number): string => `#${hex.toString(16).padStart(6, "0")}`;

/** A palette colour at the given opacity, for canvas fills that must track the tested tokens. */
export const cssRgba = (hex: number, alpha: number): string =>
  `rgba(${(hex >> 16) & 0xff}, ${(hex >> 8) & 0xff}, ${hex & 0xff}, ${alpha})`;
