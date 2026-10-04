// Value: protects=dimmed steps really fade: switching a node material between opaque and transparent flags it for recompilation; fails_when=applyNodeState toggles transparent without needsUpdate (three keeps the opaque program) or recompiles on every state change; why_new=dim nodes did not fade in review; seam=none
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { WORKFLOW_NODES } from "@/lib/workflow/graph";

// jsdom has no 2D canvas, so the text sprites are stood in for by plain sprites.
vi.mock("@/components/workflow-3d/labels", () => ({
  createLabelSprite: () => ({ sprite: new THREE.Sprite(new THREE.SpriteMaterial()) }),
}));

const { applyNodeState, createNodeVisual } = await import("@/components/workflow-3d/nodes");

describe("applyNodeState", () => {
  it("recompiles the material only when dimming turns transparency on or off", () => {
    const visual = createNodeVisual(WORKFLOW_NODES[0]!, "Step", 0);
    const { material } = visual;
    const start = material.version;

    applyNodeState(visual, "focus");
    expect(material.version).toBe(start);

    applyNodeState(visual, "dim");
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBeLessThan(1);
    expect(material.version).toBe(start + 1);

    applyNodeState(visual, "dim");
    expect(material.version).toBe(start + 1);

    applyNodeState(visual, "idle");
    expect(material.transparent).toBe(false);
    expect(material.opacity).toBe(1);
    expect(material.version).toBe(start + 2);
  });
});
