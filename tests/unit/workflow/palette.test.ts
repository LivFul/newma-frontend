import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LANE_COLORS, SCENE_COLORS, TONE_COLORS, cssHex } from "@/components/workflow-3d/palette";
import { WORKFLOW_EDGES, WORKFLOW_LANES } from "@/lib/workflow/graph";

const TOKENS = path.resolve(__dirname, "../../../src/styles/tokens");
const css = ["color.css", "ecosystem.css"]
  .map((file) => readFileSync(path.join(TOKENS, file), "utf8"))
  .join("\n");

function token(name: string): number {
  const match = new RegExp(`--color-${name}:\\s*#([0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`token --color-${name} not found in the token CSS`);
  return parseInt(match[1]!, 16);
}

describe("scene palette", () => {
  it("matches the site tokens, so a token change cannot leave the scene in the old colours", () => {
    // The diagram the scene replaces sits on .plate-surface, so the scene mirrors the plate inks.
    expect(SCENE_COLORS.background).toBe(token("plate-elevated"));
    expect(SCENE_COLORS.ink).toBe(token("plate"));
    expect(SCENE_COLORS.text).toBe(token("plate-fg"));
    expect(SCENE_COLORS.textMuted).toBe(token("plate-muted"));
    expect(SCENE_COLORS.accent).toBe(token("plate-accent"));
    expect(SCENE_COLORS.border).toBe(token("plate-border"));
    expect(SCENE_COLORS.warning).toBe(token("plate-warning"));
    expect(SCENE_COLORS.success).toBe(token("plate-success"));
    expect(SCENE_COLORS.danger).toBe(token("plate-danger"));
    expect(SCENE_COLORS.compute).toBe(token("plate-compute"));
  });

  it("colours every lane and every transition kind in use", () => {
    for (const lane of WORKFLOW_LANES) expect(LANE_COLORS[lane.id], lane.id).toBeDefined();
    for (const tone of new Set(WORKFLOW_EDGES.map((edge) => edge.tone))) {
      expect(TONE_COLORS[tone], tone).toBeDefined();
    }
  });

  it("formats a hex colour for canvas styles", () => {
    expect(cssHex(0x0b1020)).toBe("#0b1020");
    expect(cssHex(0xffffff)).toBe("#ffffff");
  });
});
