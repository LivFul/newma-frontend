import type { EdgeTone, LaneId } from "@/lib/workflow/graph";

// The WebGL scene cannot read CSS variables, so these hex values mirror the dark plate tokens in
// src/styles/tokens/color.css (the diagram it replaces sits on .plate-surface).
// tests/unit/workflow/palette.test.ts fails when they drift, so a token change cannot leave the
// scene in the old colours.
export const SCENE_COLORS = Object.freeze({
  /** --color-plate-elevated: the plate the static diagram sits on, so the swap is seamless. */
  background: 0x244322,
  /** --color-plate */
  ink: 0x1b3319,
  /** --color-plate-fg */
  text: 0xf4f6ef,
  /** --color-plate-muted */
  textMuted: 0xbcc5a8,
  /** --color-plate-accent */
  accent: 0xc9d0b3,
  /** --color-plate-border */
  border: 0x5d7350,
  /** --color-plate-warning */
  warning: 0xf2c46b,
  /** --color-plate-success */
  success: 0xb5d39a,
  /** --color-plate-danger */
  danger: 0xf2a093,
  /** --color-plate-compute (Agentic Compute and workflow learning loop) */
  compute: 0xc4b8f0,
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
